import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  useProjectDetails, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask, 
  useAddMember,
  Task
} from "../hooks/useBoard.ts";
import { useAuthStore } from "../store/auth.store.ts";
import { 
  ArrowLeft, Plus, Users, Calendar, AlertCircle, Trash2, 
  ChevronRight, ChevronLeft, Check, Loader2, Mail
} from "lucide-react";

const COLUMNS: { id: Task["status"]; title: string; color: string }[] = [
  { id: "TODO", title: "To Do", color: "border-t-slate-400 bg-slate-900/40" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-t-indigo-500 bg-indigo-950/5" },
  { id: "IN_REVIEW", title: "In Review", color: "border-t-amber-500 bg-amber-950/5" },
  { id: "DONE", title: "Done", color: "border-t-emerald-500 bg-emerald-950/5" },
];

export const BoardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const { data: project, isLoading, error } = useProjectDetails(id);
  const createTaskMutation = useCreateTask(id || "");
  const updateTaskMutation = useUpdateTask(id || "");
  const deleteTaskMutation = useDeleteTask(id || "");
  const addMemberMutation = useAddMember(id || "");

  // Modals / forms state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Partial<Task> | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  // Form inputs for Task create/edit
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState<Task["status"]>("TODO");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("MEDIUM");
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState<string>("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium tracking-wide">Loading project board...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 px-4 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-4 max-w-md">
          <p className="font-semibold text-lg mb-1">Failed to Load Project</p>
          <p className="text-sm text-slate-400">
            {(error as any).response?.data?.error?.message || "Verify your connection or access permissions."}
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  // Open modal to add a task in a specific column status
  const handleOpenAddTask = (colStatus: Task["status"]) => {
    setTaskTitle("");
    setTaskDesc("");
    setTaskStatus(colStatus);
    setTaskPriority("MEDIUM");
    setTaskAssignee("");
    setTaskDueDate("");
    setIsEditingTask(false);
    setActiveTask(null);
    setIsTaskModalOpen(true);
  };

  // Open modal to edit a specific task
  const handleOpenEditTask = (task: Task) => {
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assigneeId || "");
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setIsEditingTask(true);
    setActiveTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const payload = {
      title: taskTitle,
      description: taskDesc || undefined,
      status: taskStatus,
      priority: taskPriority,
      assigneeId: taskAssignee || null,
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
    };

    try {
      if (isEditingTask && activeTask?.id) {
        await updateTaskMutation.mutateAsync({
          taskId: activeTask.id,
          payload,
        });
      } else {
        await createTaskMutation.mutateAsync(payload);
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Shift column status immediately on quick arrows clicks
  const handleMoveTaskStatus = async (task: Task, direction: "next" | "prev") => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === task.status);
    let nextIndex = currentIndex;
    if (direction === "next" && currentIndex < COLUMNS.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === "prev" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex !== currentIndex) {
      try {
        await updateTaskMutation.mutateAsync({
          taskId: task.id,
          payload: { status: COLUMNS[nextIndex].id },
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    if (!inviteEmail.trim()) return;

    try {
      await addMemberMutation.mutateAsync({ email: inviteEmail });
      setInviteSuccess(`Successfully added ${inviteEmail} to the project!`);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(
        err.response?.data?.error?.message || "Failed to add member. Email may not exist."
      );
    }
  };

  const getPriorityColor = (p: Task["priority"]) => {
    switch (p) {
      case "HIGH": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "MEDIUM": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "LOW": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Board Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              <p className="text-xs text-slate-400 line-clamp-1">{project.description || "No project overview description."}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Members pile */}
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {project.members?.slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    title={member.email}
                    className="w-8 h-8 rounded-full bg-slate-800 border border-slate-950 flex items-center justify-center text-xs font-semibold text-indigo-300"
                  >
                    {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                ))}
              </div>
              {project.members && project.members.length > 4 && (
                <span className="text-xs text-slate-500 font-semibold pl-1">
                  +{project.members.length - 4} more
                </span>
              )}
            </div>

            {project.ownerId === currentUser?.id && (
              <button
                onClick={() => {
                  setInviteError("");
                  setInviteSuccess("");
                  setIsInviteOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.8 rounded-xl text-xs font-bold border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-600 hover:text-white hover:border-transparent transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Invite
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Kanban Board Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 items-start">
          {COLUMNS.map((column) => {
            const columnTasks = project.tasks?.filter((t) => t.status === column.id) || [];

            return (
              <div
                key={column.id}
                className={`glass-card p-4 rounded-2xl border-t-4 ${column.color} border-x border-b border-slate-900/50 flex flex-col max-h-[75vh]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-sm uppercase tracking-wider text-slate-300">
                    {column.title}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5">
                  {columnTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-600 italic">
                      Empty column. Add a task to start.
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="glass-card hover:bg-slate-800/25 p-4 rounded-xl border border-slate-800 hover:border-slate-700/80 shadow-md group transition"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 
                            onClick={() => handleOpenEditTask(task)}
                            className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 cursor-pointer transition line-clamp-2"
                          >
                            {task.title}
                          </h3>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-auto">
                          {/* Left actions: Priority & Assignee */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <div
                                title={`Assigned to ${task.assignee.name}`}
                                className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-indigo-300 border border-slate-700"
                              >
                                {task.assignee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Right actions: quick column shift */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                            {column.id !== "TODO" && (
                              <button
                                onClick={() => handleMoveTaskStatus(task, "prev")}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                                title="Move Left"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {column.id !== "DONE" && (
                              <button
                                onClick={() => handleMoveTaskStatus(task, "next")}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                                title="Move Right"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-900/50">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add task CTA */}
                <button
                  onClick={() => handleOpenAddTask(column.id)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-300 hover:border-slate-700 hover:bg-slate-800/10 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Invite Member Dialog Overlay */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-7 border border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Invite Colleague
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Add user directly to this board. Note: they must already have a registered BoardHub account.
            </p>

            {inviteSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {inviteSuccess}
              </div>
            )}
            {inviteError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Colleague Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="colleague@boardhub.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-200 glass-input focus:outline-none focus:ring-2 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800 text-slate-400 hover:bg-slate-800/40 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal Overlay (Create / Edit) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-7 border border-slate-800 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {isEditingTask ? "Edit Task Details" : "Create New Task"}
              </h2>
              {isEditingTask && (
                <button
                  type="button"
                  onClick={() => handleDeleteTask(activeTask?.id || "")}
                  className="p-2 rounded-xl border border-rose-500/10 text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/5 transition"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summarize the action item..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 glass-input focus:outline-none focus:ring-2 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Elaborate details, checklists, links..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 glass-input focus:outline-none focus:ring-2 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Status Column
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as Task["status"])}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-300 glass-input focus:outline-none focus:ring-2 transition bg-slate-900"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Priority Level
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-300 glass-input focus:outline-none focus:ring-2 transition bg-slate-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Assignee
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-300 glass-input focus:outline-none focus:ring-2 transition bg-slate-900"
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-300 glass-input focus:outline-none focus:ring-2 transition bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-800 text-slate-400 hover:bg-slate-800/40 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {createTaskMutation.isPending || updateTaskMutation.isPending ? "Saving..." : isEditingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardView;
