import type { NextApiRequest, NextApiResponse } from "next"
import { v4 as uuidv4 } from "uuid"
import { tasks } from "@/lib/store"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        return res.status(200).json(tasks)
    }

    if (req.method === "POST") {
        const newTask = { id: uuidv4(), ...req.body }
        tasks.push(newTask)
        return res.status(201).json(newTask)
    }

    res.status(405).end()
}
