import { Data, Effect, pipe } from "effect"

/**
 * Creates an Effect from a Promise, handling errors and logging.
 *
 * @template A - The success type of the promise.
 * @template E - The custom error type to throw on promise rejection.
 * @template R - The context/environment required by the promise factory (if any).
 * @param {() => Promise<A>} promiseFactory - A function that returns the Promise to be wrapped.
 * @param {(cause: unknown, message: string) => E} errorFactory - A function to map the unknown promise rejection cause to your specific error type E.
 * @param {string} [errorMessage] - An optional custom error message. Defaults to "Promise failed".
 * @returns {Effect.Effect<A, E, R>} An Effect that resolves to the promise's success value, or your custom error E.
 */
export function effectifyPromise<A, E, R = never>(
  promiseFactory: () => Promise<A>,
  errorFactory: (obj: { cause: unknown; message: string }) => E = (a) => new ServerError(a) as E,
  errorMessage: string = "Promise failed"
): Effect.Effect<A, E, R> {
  return pipe(
    Effect.tryPromise({
      try: promiseFactory,
      catch: (cause) => errorFactory({ cause, message: errorMessage })
    }),
    Effect.tapError((error) => Effect.logError("Effectified Promise Error:", errorMessage, error))
  )
}

export class ServerError extends Data.TaggedError("ServerError")<{
  message?: string
  cause?: unknown
}> {
  constructor(args?: { message?: string; cause?: unknown }) {
    super({
      message: args?.message ?? "Server error",
      cause: args?.cause
    })
  }
}

export interface Affiliation {
  name: string
  city: string
  country: string
}

export interface Prize {
  year: string
  category: string
  share: string
  motivation: string
  // Use optional chaining because some prizes have no affiliations
  affiliations?: Affiliation[]
}

export interface Laureate {
  _id: string // MongoDB ObjectId string
  id: string // Internal Nobel ID
  firstname: string
  surname: string
  born: string // "YYYY-MM-DD"
  died?: string
  bornCountry: string
  bornCountryCode: string
  bornCity: string
  diedCountry?: string
  diedCountryCode?: string
  diedCity?: string
  gender: "male" | "female" | "org" // Added "org" as some winners are organizations
  prizes: Prize[]
}

// {
//     "_id": "699ed4086dc463d0400bc1b2",
//     "id": "5",
//     "firstname": "Pierre",
//     "surname": "Curie",
//     "born": "1859-05-15",
//     "died": "1906-04-19",
//     "bornCountry": "France",
//     "bornCountryCode": "FR",
//     "bornCity": "Paris",
//     "diedCountry": "France",
//     "diedCountryCode": "FR",
//     "diedCity": "Paris",
//     "gender": "male",
//     "prizes": [
//       {
//         "year": "1903",
//         "category": "physics",
//         "share": "4",
//         "motivation": "\"in recognition of the extraordinary services they have rendered by their joint researches on the radiation phenomena discovered by Professor Henri Becquerel\"",
//         "affiliations": [
//           {
//             "name": "École municipale de physique et de chimie industrielles (Municipal School of Industrial Physics and Chemistry)",
//             "city": "Paris",
//             "country": "France"
//           }
//         ]
//       }
//     ]
// }
