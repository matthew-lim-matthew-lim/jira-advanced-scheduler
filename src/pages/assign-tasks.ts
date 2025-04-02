import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { tasks, users } = req.body

        const assignedTasks = tasks.map((task: any, i: number) => ({
            taskId: task.id,
            userId: users[i % users.length].id,
        }))

        return res.status(200).json({ assignedTasks })
    }

    res.status(405).end()
}
