import { Effect } from "effect"
import { Router } from "express"

import { nobels } from ".."
import { effectifyPromise } from "../utils"

const router = Router()

router.get("/categories", async (req, res) => {
  const program = Effect.gen(function* () {
    const grouped = yield* effectifyPromise(() =>
      nobels
        .aggregate([
          { $unwind: "$prizes" },

          {
            $group: {
              _id: "$prizes.category",
              itemCount: { $sum: 1 }
            }
          },

          { $sort: { itemCount: -1 } }
        ])
        .toArray()
    )
    yield* Effect.logInfo({ grouped })
    return grouped.map((a) => ({
      category: a._id,
      count: a.itemCount
    }))
  })
  res.send(await Effect.runPromise(program))
})

router.get("/countries", async (req, res) => {
  const program = Effect.gen(function* () {
    const grouped = yield* effectifyPromise(() =>
      nobels
        .aggregate([
          {
            $group: {
              _id: "$bornCountry",
              itemCount: { $sum: 1 },

              countryCode: { $first: "$bornCountryCode" },

              laureates: { $push: "$firstname" },

              details: {
                $push: {
                  name: "$firstname",
                  surname: "$surname",
                  gender: "$gender"
                }
              }
            }
          },
          { $sort: { itemCount: -1 } }
        ])
        .toArray()
    )
    return grouped
  })
  res.send(await Effect.runPromise(program))
})

router.get("/years", async (req, res) => {
  const program = Effect.gen(function* () {
    const grouped = yield* effectifyPromise(() =>
      nobels
        .aggregate([
          { $unwind: "$prizes" },
          {
            $group: {
              _id: "$prizes.year",
              itemCount: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } }
        ])
        .toArray()
    )
    return grouped
  })
  res.send(await Effect.runPromise(program))
})

export const statsRouter = router
