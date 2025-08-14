//
//  Intent.swift
//  MyIntentApp
//
//  Created by Aaron Tan on 14/08/2025.
//

import Foundation
import AppIntents

// Main crypto information intent
@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
struct GetCryptoAnswerIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Crypto Information"
    static var description = IntentDescription("Ask about cryptocurrency prices and market information using CoinGecko data")
    static var isDiscoverable: Bool = true
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Query", description: "Your question about cryptocurrency (e.g., 'Bitcoin price', 'Ethereum market cap')")
    var query: String
    
    init() {}
    
    init(query: String) {
        self.query = query
    }
    
    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        // Use production URL or fallback to localhost for development
        let serverURL = ProcessInfo.processInfo.environment["COINGECKO_SERVER_URL"] ?? "http://192.168.1.12:3000/siri"
        
        // Debug logging
        print("🔍 CoinGecko Intent - Starting request to: \(serverURL)")
        print("🔍 Query: \(query)")
        
        guard let url = URL(string: serverURL) else {
            print("❌ Invalid URL: \(serverURL)")
            throw CryptoError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60.0 // 120 second timeout for backend processing
        
        let requestBody = ["query": query]
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        do {
            print("🔍 Making network request...")
            let (data, response) = try await URLSession.shared.data(for: request)
            
            print("🔍 Received response")
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid HTTP response")
                throw CryptoError.invalidResponse
            }
            
            if httpResponse.statusCode != 200 {
                print("❌ Server error - Status code: \(httpResponse.statusCode)")
                throw CryptoError.serverError(statusCode: httpResponse.statusCode)
            }
            
            print("✅ Response status: \(httpResponse.statusCode)")
            let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            print("🔍 Response data: \(String(data: data, encoding: .utf8) ?? "Unable to decode")")
            
            guard let success = jsonResponse?["success"] as? Bool, success else {
                let errorMessage = jsonResponse?["error"] as? String ?? "Unknown error"
                print("❌ API error: \(errorMessage)")
                throw CryptoError.apiError(message: errorMessage)
            }
            
            guard let speech = jsonResponse?["speech"] as? String else {
                print("❌ Missing speech in response")
                throw CryptoError.invalidResponse
            }
            
            print("✅ Success - Speech: \(speech)")
            return .result(
                value: speech,
                dialog: IntentDialog(stringLiteral: speech)
            )
            
        } catch {
            print("❌ Caught error: \(error)")
            if error is CryptoError {
                throw error
            }
            
            // Provide fallback responses for common network issues
            let nsError = error as NSError
            print("❌ NSError code: \(nsError.code), domain: \(nsError.domain)")
            
            if nsError.code == NSURLErrorNotConnectedToInternet {
                throw CryptoError.networkError("No internet connection available. Please check your network and try again.")
            } else if nsError.code == NSURLErrorTimedOut {
                throw CryptoError.networkError("Request timed out. The server might be busy, please try again later.")
            } else if nsError.code == NSURLErrorCannotConnectToHost {
                throw CryptoError.networkError("Cannot connect to server. Please check if the server is running.")
            }
            
            throw CryptoError.networkError("Network error: \(error.localizedDescription)")
        }
    }
}

// Quick price check intent for popular cryptocurrencies
@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
struct GetQuickPriceIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Crypto Price"
    static var description = IntentDescription("Get the current price of a popular cryptocurrency")
    static var isDiscoverable: Bool = true
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Cryptocurrency", description: "The cryptocurrency to check")
    var cryptocurrency: CryptocurrencyEntity
    
    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let query = "What is the current price of \(cryptocurrency.name)?"
        
        let intent = GetCryptoAnswerIntent(query: query)
        return try await intent.perform()
    }
}

// Entity for popular cryptocurrencies
@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
struct CryptocurrencyEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Cryptocurrency"
    static var defaultQuery = CryptocurrencyQuery()
    
    var id: String
    var name: String
    var symbol: String
    
    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name) (\(symbol.uppercased()))")
    }
    
    static let bitcoin = CryptocurrencyEntity(id: "bitcoin", name: "Bitcoin", symbol: "BTC")
    static let ethereum = CryptocurrencyEntity(id: "ethereum", name: "Ethereum", symbol: "ETH")
    static let cardano = CryptocurrencyEntity(id: "cardano", name: "Cardano", symbol: "ADA")
    static let solana = CryptocurrencyEntity(id: "solana", name: "Solana", symbol: "SOL")
    static let ripple = CryptocurrencyEntity(id: "ripple", name: "Ripple", symbol: "XRP")
    static let dogecoin = CryptocurrencyEntity(id: "dogecoin", name: "Dogecoin", symbol: "DOGE")
    static let polkadot = CryptocurrencyEntity(id: "polkadot", name: "Polkadot", symbol: "DOT")
    static let chainlink = CryptocurrencyEntity(id: "chainlink", name: "Chainlink", symbol: "LINK")
    static let litecoin = CryptocurrencyEntity(id: "litecoin", name: "Litecoin", symbol: "LTC")
    static let polygon = CryptocurrencyEntity(id: "matic-network", name: "Polygon", symbol: "MATIC")
}

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
struct CryptocurrencyQuery: EntityQuery {
    func entities(for identifiers: [CryptocurrencyEntity.ID]) async throws -> [CryptocurrencyEntity] {
        return popularCryptocurrencies.filter { identifiers.contains($0.id) }
    }
    
    func suggestedEntities() async throws -> [CryptocurrencyEntity] {
        return popularCryptocurrencies
    }
    
    private var popularCryptocurrencies: [CryptocurrencyEntity] {
        return [
            .bitcoin, .ethereum, .cardano, .solana, .ripple,
            .dogecoin, .polkadot, .chainlink, .litecoin, .polygon
        ]
    }
}

// Error handling for crypto-related operations
enum CryptoError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int)
    case apiError(message: String)
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid server URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let statusCode):
            return "Server error with status code: \(statusCode)"
        case .apiError(let message):
            return "API error: \(message)"
        case .networkError(let message):
            return "Network error: \(message)"
        }
    }
}

// App Shortcuts Provider for predefined Siri shortcuts
@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
struct CoinGeckoAppShortcutsProvider: AppShortcutsProvider {
    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        // General crypto inquiry shortcut
        AppShortcut(
            intent: GetCryptoAnswerIntent(),
            phrases: [
                "Ask \(.applicationName) about crypto",
                "Get crypto information from \(.applicationName)",
                "Check cryptocurrency prices with \(.applicationName)",
                "What's happening in crypto today",
                "Get market data from \(.applicationName)",
                "Ask about cryptocurrency market"
            ],
            shortTitle: "Crypto Info",
            systemImageName: "bitcoinsign.circle"
        )
        
        // Quick Bitcoin price check
        AppShortcut(
            intent: GetCryptoAnswerIntent(query: "What is the current price of Bitcoin?"),
            phrases: [
                "What's Bitcoin price",
                "Check Bitcoin price",
                "How much is Bitcoin",
                "Bitcoin current price",
                "Get Bitcoin price from \(.applicationName)",
                "What's BTC price"
            ],
            shortTitle: "Bitcoin Price",
            systemImageName: "bitcoinsign.circle.fill"
        )
        
        // Quick Ethereum price check
        AppShortcut(
            intent: GetCryptoAnswerIntent(query: "What is the current price of Ethereum?"),
            phrases: [
                "What's Ethereum price",
                "Check Ethereum price", 
                "How much is Ethereum",
                "Ethereum current price",
                "Get Ethereum price from \(.applicationName)",
                "What's ETH price"
            ],
            shortTitle: "Ethereum Price",
            systemImageName: "e.circle.fill"
        )
        
        // Market trends inquiry
        AppShortcut(
            intent: GetCryptoAnswerIntent(query: "What are the top trending cryptocurrencies today?"),
            phrases: [
                "What's trending in crypto",
                "Show me crypto trends",
                "Top cryptocurrencies today",
                "What's hot in crypto market",
                "Get trending cryptocurrencies"
            ],
            shortTitle: "Crypto Trends",
            systemImageName: "chart.line.uptrend.xyaxis"
        )
        
        // Market overview
        AppShortcut(
            intent: GetCryptoAnswerIntent(query: "Give me a cryptocurrency market overview"),
            phrases: [
                "Crypto market overview",
                "How's the crypto market",
                "Cryptocurrency market summary",
                "Market overview from \(.applicationName)",
                "Show me crypto market status"
            ],
            shortTitle: "Market Overview",
            systemImageName: "chart.bar.fill"
        )
        
        // Additional popular crypto shortcuts
        AppShortcut(
            intent: GetCryptoAnswerIntent(query: "What is the current price of Solana?"),
            phrases: [
                "What's Solana price",
                "Check Solana price",
                "How much is Solana",
                "Solana current price",
                "What's SOL price"
            ],
            shortTitle: "Solana Price",
            systemImageName: "s.circle.fill"
        )
        
        AppShortcut(
            intent: GetCryptoAnswerIntent(query: "What is the current price of Cardano?"),
            phrases: [
                "What's Cardano price",
                "Check Cardano price",
                "How much is Cardano",
                "Cardano current price",
                "What's ADA price"
            ],
            shortTitle: "Cardano Price",
            systemImageName: "a.circle.fill"
        )
        
        AppShortcut(
            intent: GetCryptoAnswerIntent(query: "What is the current price of Dogecoin?"),
            phrases: [
                "What's Dogecoin price",
                "Check Dogecoin price",
                "How much is Dogecoin",
                "Dogecoin current price",
                "What's DOGE price"
            ],
            shortTitle: "Dogecoin Price",
            systemImageName: "d.circle.fill"
        )
    }
}

// Legacy intent structure for backward compatibility (keeping your original structure)
@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
struct Intent: AppIntent, CustomIntentMigratedAppIntent, PredictableIntent {
    static let intentClassName = "IntentIntent"

    static var title: LocalizedStringResource = "Legacy Intent"
    static var description = IntentDescription("Legacy intent for backward compatibility")

    @Parameter(title: "Parameter")
    var parameter: String?

    static var parameterSummary: some ParameterSummary {
        Summary {
            \.$parameter
        }
    }

    static var predictionConfiguration: some IntentPredictionConfiguration {
        IntentPrediction(parameters: (\.$parameter)) { parameter in
            DisplayRepresentation(
                title: LocalizedStringResource(stringLiteral: "Legacy Intent"),
                subtitle: LocalizedStringResource(stringLiteral: parameter ?? "No parameter")
            )
        }
    }

    func perform() async throws -> some IntentResult {
        // If parameter is provided, treat it as a crypto query
        if let query = parameter, !query.isEmpty {
            let cryptoIntent = GetCryptoAnswerIntent(query: query)
            _ = try await cryptoIntent.perform()
            return .result(value: "Processed: \(query)")
        }
        
        // Default behavior
        return .result(value: "Legacy intent executed")
    }
}
