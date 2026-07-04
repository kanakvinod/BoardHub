import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store.ts";
import { useProjects, useCreateProject } from "../hooks/useBoard.ts";
import { Plus, FolderKanban, Users, LogOut, CheckSquare, Loader2, BookOpen } from "lucide-react";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: projects, isLoading, error } = useProjects();
  const createProjectMutation = useCreateProject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    try {
      await createProjectMutation.mutateAsync({
        name: projName,
        description: projDesc,
      });
      setProjName("");
      setProjDesc("");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium tracking-wide">Loading workspace boards...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 px-4 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-4 max-w-md">
          <p className="font-semibold text-lg mb-1">Failed to Load Workspace</p>
          <p className="text-sm text-slate-400">{(error as any).response?.data?.error?.message || "Verify your backend is running."}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate statistics
  const totalProjects = projects?.length || 0;
  const totalTasks = projects?.reduce((acc, p) => acc + (p._count?.tasks || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white font-sans">
                Board<span className="text-indigo-400">Hub</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-200">{user?.name}</span>
              <span className="text-xs text-slate-400">{user?.email}</span>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-800 hidden md:block"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Banner Welcome */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              Welcome back, {user?.name.split(" ")[0]}!
            </h1>
            <p className="mt-1.5 text-slate-400 text-sm md:text-base">
              Here is what's happening across your team projects today.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition duration-150 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Board</span>
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <div className="glass-card p-6 rounded-2xl border border-slate-800/60">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Boards</span>
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{totalProjects}</div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800/60">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{totalTasks}</div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800/60 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documentation</span>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <a 
              href="http://localhost:4000/api-docs" 
              target="_blank" 
              rel="noreferrer" 
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
            >
              Open API References &rarr;
            </a>
          </div>
        </div>

        {/* Project Lists */}
        <div>
          <h2 className="text-lg font-bold text-slate-300 mb-6">Your Project Boards</h2>

          {totalProjects === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-slate-800/60 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-6">
              <div className="p-4 bg-slate-800/40 border border-slate-700/40 rounded-full text-slate-500 mb-5">
                <FolderKanban className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">No projects found</h3>
              <p className="text-sm text-slate-400 max-w-sm mb-6">
                You haven't joined or created any project boards yet. Create a new board to get started with task tracking.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition"
              >
                Create your first board
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/board/${project.id}`)}
                  className="glass-card hover:bg-slate-800/20 p-6 rounded-2xl border border-slate-800 hover:border-slate-700/80 cursor-pointer shadow-lg hover:shadow-indigo-500/5 group transition duration-300 flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition mb-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {project._count?.tasks} {project._count?.tasks === 1 ? "task" : "tasks"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {project._count?.members} {project._count?.members === 1 ? "member" : "members"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-7 border border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-6">Create New Project Board</h2>
            
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Board Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Marketing Campaign"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 glass-input focus:outline-none focus:ring-2 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify brief overview, goals, or objectives..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 glass-input focus:outline-none focus:ring-2 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
