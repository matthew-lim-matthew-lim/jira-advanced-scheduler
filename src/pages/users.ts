import type { NextApiRequest, NextApiResponse } from "next"
import { users } from "@/lib/store"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        return res.status(200).json(users)
    }

    res.status(405).end()
}
