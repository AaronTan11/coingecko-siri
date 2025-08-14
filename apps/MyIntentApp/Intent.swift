//
//  Intent.swift
//  MyIntentApp
//
//  Created by Aaron Tan on 14/08/2025.
//

import Foundation
import AppIntents

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
struct Intent: AppIntent, CustomIntentMigratedAppIntent, PredictableIntent {
    static let intentClassName = "IntentIntent"

    static var title: LocalizedStringResource = "Intent"
    static var description = IntentDescription("")

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
                title: "",
                subtitle: ""
            )
        }
    }

    func perform() async throws -> some IntentResult {
        // TODO: Place your refactored intent handler code here.
        return .result()
    }
}


