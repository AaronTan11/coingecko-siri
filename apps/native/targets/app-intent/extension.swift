import AppIntents
import Foundation

@main
struct CoinGeckoAppIntents: AppIntentsExtension {
}

struct GetCryptoAnswerIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Crypto Information"
    static var description: LocalizedStringResource = "Ask about cryptocurrency prices and market information using CoinGecko data"
    static var isDiscoverable: Bool = true
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Query", description: "Your question about cryptocurrency (e.g., 'Bitcoin price', 'Ethereum market cap')")
    var query: String
    
    init() {}
    
    init(query: String) {
        self.query = query
    }
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Use production URL or fallback to localhost for development
        let serverURL = ProcessInfo.processInfo.environment["COINGECKO_SERVER_URL"] ?? "http://localhost:3000/siri"
        
        guard let url = URL(string: serverURL) else {
            throw CryptoError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60.0 // 10 second timeout
        
        let requestBody = ["query": query]
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw CryptoError.invalidResponse
            }
            
            if httpResponse.statusCode != 200 {
                throw CryptoError.serverError(statusCode: httpResponse.statusCode)
            }
            
            let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            
            guard let success = jsonResponse?["success"] as? Bool, success else {
                let errorMessage = jsonResponse?["error"] as? String ?? "Unknown error"
                throw CryptoError.apiError(message: errorMessage)
            }
            
            guard let speech = jsonResponse?["speech"] as? String else {
                throw CryptoError.invalidResponse
            }
            
            return .result(
                value: speech,
                dialog: IntentDialog(stringLiteral: speech)
            )
            
        } catch {
            if error is CryptoError {
                throw error
            }
            
            // Provide fallback responses for common network issues
            if (error as NSError).code == NSURLErrorNotConnectedToInternet {
                throw CryptoError.networkError("No internet connection available. Please check your network and try again.")
            } else if (error as NSError).code == NSURLErrorTimedOut {
                throw CryptoError.networkError("Request timed out. The server might be busy, please try again later.")
            }
            
            throw CryptoError.networkError(error.localizedDescription)
        }
    }
}

// Quick price check intent for popular cryptocurrencies
struct GetQuickPriceIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Crypto Price"
    static var description: LocalizedStringResource = "Get the current price of a popular cryptocurrency"
    static var isDiscoverable: Bool = true
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Cryptocurrency", description: "The cryptocurrency to check")
    var cryptocurrency: CryptocurrencyEntity
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let query = "What is the current price of \(cryptocurrency.name)?"
        
        let intent = GetCryptoAnswerIntent(query: query)
        return try await intent.perform()
    }
}

// Entity for popular cryptocurrencies
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

// App Shortcuts Provider
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
            intent: GetQuickPriceIntent(),
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
            intent: GetQuickPriceIntent(),
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
    }
}