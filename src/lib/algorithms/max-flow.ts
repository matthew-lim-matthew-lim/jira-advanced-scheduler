interface Edge {
  to: number
  capacity: number
  flow: number
  reverse: number
}

interface Graph {
  vertices: number
  edges: Edge[][]
}

// Create a new graph with the given number of vertices
export function createGraph(vertices: number): Graph {
  const edges: Edge[][] = Array(vertices)
    .fill(null)
    .map(() => [])
  return { vertices, edges }
}

// Add an edge to the graph
export function addEdge(graph: Graph, from: number, to: number, capacity: number): void {
  // Forward edge
  const forwardEdge: Edge = { to, capacity, flow: 0, reverse: graph.edges[to].length }

  // Backward edge (for residual graph)
  const backwardEdge: Edge = { to: from, capacity: 0, flow: 0, reverse: graph.edges[from].length }

  graph.edges[from].push(forwardEdge)
  graph.edges[to].push(backwardEdge)
}

// Find a path from source to sink using BFS
function bfs(graph: Graph, source: number, sink: number): number[] | null {
  const visited = Array(graph.vertices).fill(false)
  const parent: number[] = Array(graph.vertices).fill(-1)
  const queue: number[] = []

  queue.push(source)
  visited[source] = true

  while (queue.length > 0) {
    const u = queue.shift()!

    for (let i = 0; i < graph.edges[u].length; i++) {
      const edge = graph.edges[u][i]

      if (!visited[edge.to] && edge.capacity > edge.flow) {
        queue.push(edge.to)
        parent[edge.to] = u
        visited[edge.to] = true
      }
    }
  }

  // If we reached the sink, return the path
  return visited[sink] ? parent : null
}

// Find the maximum flow from source to sink
// Add the export keyword to the function declaration
export function fordFulkerson(graph: Graph, source: number, sink: number): number {
  let maxFlow = 0

  // Augment the flow while there is a path from source to sink
  let path = bfs(graph, source, sink)

  while (path !== null) {
    // Find the minimum residual capacity along the path
    let minCapacity = Number.POSITIVE_INFINITY
    let v = sink

    while (v !== source) {
      const u = path[v]
      const edgeIndex = graph.edges[u].findIndex((e) => e.to === v)
      const edge = graph.edges[u][edgeIndex]
      minCapacity = Math.min(minCapacity, edge.capacity - edge.flow)
      v = u
    }

    // Update the flow along the path
    v = sink
    while (v !== source) {
      const u = path[v]
      const edgeIndex = graph.edges[u].findIndex((e) => e.to === v)
      const edge = graph.edges[u][edgeIndex]

      edge.flow += minCapacity
      graph.edges[v][edge.reverse].flow -= minCapacity

      v = u
    }

    maxFlow += minCapacity
    path = bfs(graph, source, sink)
  }

  return maxFlow
}

// Get the assignment of tasks to users after running the max flow algorithm
// Add the export keyword to the function declaration
export function getAssignments(graph: Graph, numTasks: number, numUsers: number): { taskId: number; userId: number }[] {
  const assignments: { taskId: number; userId: number }[] = []

  // Tasks are vertices 1 to numTasks
  // Users are vertices numTasks+1 to numTasks+numUsers
  for (let taskVertex = 1; taskVertex <= numTasks; taskVertex++) {
    for (const edge of graph.edges[taskVertex]) {
      // If there's flow on this edge and it goes to a user vertex
      if (edge.flow > 0 && edge.to > numTasks && edge.to <= numTasks + numUsers) {
        assignments.push({
          taskId: taskVertex - 1, // Convert to 0-indexed
          userId: edge.to - numTasks - 1, // Convert to 0-indexed
        })
      }
    }
  }

  return assignments
}

