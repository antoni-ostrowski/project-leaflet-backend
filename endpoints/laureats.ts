import { Effect, Schema } from "effect"
import { Router } from "express"

import { nobels } from ".."
import { effectifyPromise } from "../utils"

const router = Router()

const laureatsListSchema = Schema.Struct({
  category: Schema.optional(Schema.String),
  year: Schema.optional(Schema.NumberFromString),
  country: Schema.optional(Schema.String),
  search: Schema.optional(Schema.String),
  page: Schema.optional(Schema.NumberFromString),
  limit: Schema.optional(Schema.NumberFromString)
})

router.get("/", async (req, res) => {
  const program = Effect.gen(function* () {
    const searchParams = yield* Schema.decodeUnknownEffect(laureatsListSchema)(req.query)

    const query: Record<string, unknown> = {}

    if (searchParams.category) {
      query["prizes.category"] = { $regex: searchParams.category, $options: "i" }
    }

    if (searchParams.year) {
      query["prizes.year"] = searchParams.year
    }

    if (searchParams.country) {
      query["bornCountryCode"] = searchParams.country.toUpperCase()
    }

    if (searchParams.search) {
      query.$or = [
        { firstname: { $regex: searchParams.search, $options: "i" } },
        { surname: { $regex: searchParams.search, $options: "i" } }
      ]
    }

    yield* Effect.logInfo({ searchParams, query })

    const page = searchParams.page ?? 1
    const limit = searchParams.limit ?? 0
    const skip = (page - 1) * (limit || 0)

    let queryBuilder = nobels.find(query)
    if (limit > 0) {
      queryBuilder = queryBuilder.skip(skip).limit(limit)
    }

    const laureates = yield* effectifyPromise(() => queryBuilder.toArray())
    const totalCount = yield* effectifyPromise(() => nobels.countDocuments(query))

    return {
      data: laureates,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
        hasMore: limit > 0 ? skip + limit < totalCount : false
      }
    }
  })

  const result = await Effect.runPromise(program)
  res.json(result)
})

router.get("/:id", async (req, res) => {
  const id = req.params.id
  const program = Effect.gen(function* () {
    const query = { id: id }
    const nobel = yield* effectifyPromise(() => nobels.findOne(query))
    if (!nobel) {
      res.status(404).json("laureate not found")
      return null
    }
    return nobel
  })

  res.send(await Effect.runPromise(program))
})

export const laureatsRouter = router