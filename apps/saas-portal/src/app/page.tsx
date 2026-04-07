import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">SaaS Dashboard</h1>
      <div className="bg-green-100 text-green-800 p-4 rounded mb-4 shadow">
        ✅ Authenticated Profile Loaded!
      </div>
      <div className="bg-gray-100 p-6 rounded shadow-inner">
        <h2 className="font-semibold mb-2 text-gray-700">Strict Auth payload (Phase 2 Ready):</h2>
        <pre className="text-sm overflow-auto bg-gray-800 text-green-400 p-4 rounded">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  )
}
