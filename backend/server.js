const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Mock data 
let mockTasks = [
    {
        id: "t1",
        title: "Implement user authentication",
        description: "Add login and registration functionality with JWT",
        status: "to-do",
        priority: "high",
        storyPoints: 8,
        requiredSkills: ["backend", "security"],
        dependencies: [],
    },
    {
        id: "t2",
        title: "Design dashboard UI",
        description: "Create wireframes and mockups for the main dashboard",
        status: "in-progress",
        priority: "medium",
        storyPoints: 5,
        assigneeId: "u2",
        requiredSkills: ["design", "frontend"],
        dependencies: [],
    },
    {
        id: "t3",
        title: "Implement task board component",
        description: "Create a drag-and-drop task board similar to Trello",
        status: "to-do",
        priority: "medium",
        storyPoints: 13,
        requiredSkills: ["frontend", "react"],
        dependencies: ["t2"],
    },
    {
        id: "t4",
        title: "Set up CI/CD pipeline",
        description: "Configure GitHub Actions for automated testing and deployment",
        status: "to-do",
        priority: "low",
        storyPoints: 5,
        requiredSkills: ["devops"],
        dependencies: [],
    },
    {
        id: "t5",
        title: "Implement API endpoints for tasks",
        description: "Create REST API endpoints for CRUD operations on tasks",
        status: "done",
        priority: "high",
        storyPoints: 8,
        assigneeId: "u1",
        requiredSkills: ["backend", "api"],
        dependencies: [],
    },
    {
        id: "t6",
        title: "Write unit tests for backend",
        description: "Increase test coverage for backend services",
        status: "to-do",
        priority: "medium",
        storyPoints: 5,
        requiredSkills: ["testing", "backend"],
        dependencies: ["t5"],
    },
    {
        id: "t7",
        title: "Implement dependency visualization",
        description: "Add visual indicators for task dependencies in the UI",
        status: "to-do",
        priority: "medium",
        storyPoints: 8,
        requiredSkills: ["frontend", "react"],
        dependencies: ["t3"],
    },
    {
        id: "t8",
        title: "Optimize database queries",
        description: "Improve performance of database queries for task listing",
        status: "to-do",
        priority: "low",
        storyPoints: 5,
        requiredSkills: ["backend", "database"],
        dependencies: ["t5"],
    },
];

const mockUsers = [
    {
        id: "u1",
        name: "John Doe",
        email: "john@example.com",
        role: "Backend Developer",
        skills: ["backend", "api", "database", "security"],
        capacity: 20,
        currentLoad: 8,
        avatarUrl: "/placeholder.svg?height=40&width=40",
    },
    {
        id: "u2",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "UI/UX Designer",
        skills: ["design", "frontend", "ui", "ux"],
        capacity: 15,
        currentLoad: 5,
        avatarUrl: "/placeholder.svg?height=40&width=40",
    },
    {
        id: "u3",
        name: "Bob Johnson",
        email: "bob@example.com",
        role: "Frontend Developer",
        skills: ["frontend", "react", "javascript"],
        capacity: 18,
        currentLoad: 0,
        avatarUrl: "/placeholder.svg?height=40&width=40",
    },
    {
        id: "u4",
        name: "Alice Williams",
        email: "alice@example.com",
        role: "DevOps Engineer",
        skills: ["devops", "aws", "kubernetes", "ci/cd"],
        capacity: 12,
        currentLoad: 0,
        avatarUrl: "/placeholder.svg?height=40&width=40",
    },
];

// API endpoints
app.get('/api/tasks', (req, res) => {
    res.json(mockTasks);
});

app.get('/api/users', (req, res) => {
    res.json(mockUsers);
});

app.post('/api/assign-tasks', (req, res) => {
    const { tasks, users } = req.body;

    // Simple assignment logic - replace with your actual algorithm
    const unassignedTasks = tasks.filter(task => !task.assigneeId && task.status === "to-do");
    const availableUsers = [...mockUsers];

    const assignments = [];

    for (const task of unassignedTasks) {
        // Find a user with matching skills and capacity
        const suitableUser = availableUsers.find(user =>
            task.requiredSkills.some(skill => user.skills.includes(skill)) &&
            (user.currentLoad + task.storyPoints) <= user.capacity
        );

        if (suitableUser) {
            assignments.push({
                taskId: task.id,
                userId: suitableUser.id,
            });

            // Update user's current load
            suitableUser.currentLoad += task.storyPoints;

            // Update task in mock data
            const taskIndex = mockTasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                mockTasks[taskIndex].assigneeId = suitableUser.id;
                mockTasks[taskIndex].status = "in-progress";
            }
        }
    }

    res.json({
        assignments,
        unassignedTaskIds: unassignedTasks
            .filter(task => !assignments.some(a => a.taskId === task.id))
            .map(task => task.id),
    });
});

app.post('/api/tasks', (req, res) => {
    const taskData = req.body;
    const newTask = {
        id: `t${mockTasks.length + 1}`,
        title: taskData.title || "New Task",
        description: taskData.description || "",
        status: taskData.status || "to-do",
        priority: taskData.priority || "medium",
        storyPoints: taskData.storyPoints || 1,
        assigneeId: taskData.assigneeId,
        requiredSkills: taskData.requiredSkills || [],
        dependencies: taskData.dependencies || [],
    };

    mockTasks.push(newTask);
    res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const taskData = req.body;

    const taskIndex = mockTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: `Task with ID ${taskId} not found` });
    }

    const updatedTask = {
        ...mockTasks[taskIndex],
        ...taskData,
    };

    mockTasks[taskIndex] = updatedTask;
    res.json(updatedTask);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});