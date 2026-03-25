"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  Pencil,
  Trash2,
  Plus,
  X,
  Globe,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  ListTodo,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getInitials, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import {
  useContactNotes,
  useCreateNote,
  useDeleteNote,
  useContactTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useAddTag,
  useRemoveTag,
} from "@/hooks/use-contacts";
import type { Contact } from "@/types/contact";

interface ContactDetailProps {
  contact: Contact | undefined;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

// --- Notes Tab ---
function NotesTab({ contactId }: { contactId: string }) {
  const { data, isLoading } = useContactNotes(contactId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [noteBody, setNoteBody] = useState("");

  const handleAddNote = async () => {
    const trimmed = noteBody.trim();
    if (!trimmed) return;
    await createNote.mutateAsync({ contactId, body: trimmed });
    setNoteBody("");
  };

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            placeholder="Write a note..."
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!noteBody.trim() || createNote.isPending}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {createNote.isPending ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data?.notes && data.notes.length > 0 ? (
        <div className="space-y-3">
          {data.notes.map((note) => (
            <Card key={note.id} className="group">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {note.dateAdded ? timeAgo(note.dateAdded) : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 h-8 w-8 p-0 shrink-0"
                    onClick={() => deleteNote.mutate({ contactId, noteId: note.id })}
                    disabled={deleteNote.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notes yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Tasks Tab ---
function TasksTab({ contactId }: { contactId: string }) {
  const { data, isLoading } = useContactTasks(contactId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const handleAddTask = async () => {
    const trimmed = taskTitle.trim();
    if (!trimmed) return;
    await createTask.mutateAsync({
      contactId,
      title: trimmed,
      dueDate: taskDueDate || undefined,
      description: taskDescription || undefined,
    });
    setTaskTitle("");
    setTaskDueDate("");
    setTaskDescription("");
    setShowForm(false);
  };

  const toggleComplete = (taskId: string, currentCompleted: boolean) => {
    updateTask.mutate({ contactId, taskId, completed: !currentCompleted });
  };

  return (
    <div className="space-y-4">
      {/* Add task button / form */}
      {showForm ? (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Optional description..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={!taskTitle.trim() || createTask.isPending}
              >
                {createTask.isPending ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Task
        </Button>
      )}

      {/* Tasks list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data?.tasks && data.tasks.length > 0 ? (
        <div className="space-y-2">
          {data.tasks.map((task) => (
            <Card key={task.id} className="group">
              <CardContent className="py-3 flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(task.id, task.completed)}
                  className="mt-0.5 shrink-0"
                  disabled={updateTask.isPending}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.completed ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.body && (
                    <p className="text-xs text-gray-500 mt-0.5">{task.body}</p>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 h-8 w-8 p-0 shrink-0"
                  onClick={() => deleteTask.mutate({ contactId, taskId: task.id })}
                  disabled={deleteTask.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <ListTodo className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No tasks yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Tags Section ---
function TagsSection({ contact }: { contact: Contact }) {
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const [newTag, setNewTag] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleAddTag = async () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    await addTag.mutateAsync({ contactId: contact.id, tags: [trimmed] });
    setNewTag("");
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setShowInput(false);
      setNewTag("");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-500 uppercase">Tags</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {contact.tags?.map((tag) => (
          <Badge key={tag} variant="secondary" className="group/tag pr-1.5">
            {tag}
            <button
              onClick={() => removeTag.mutate({ contactId: contact.id, tags: [tag] })}
              className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
              disabled={removeTag.isPending}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {showInput ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newTag.trim()) setShowInput(false);
              }}
              placeholder="Tag name"
              className="h-6 w-24 text-xs px-2"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleAddTag}
              disabled={!newTag.trim() || addTag.isPending}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors border border-dashed border-gray-300 rounded-md px-2 py-0.5"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---
export function ContactDetail({ contact, isLoading, onEdit, onDelete }: ContactDetailProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-16">
        <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Contact not found</p>
      </div>
    );
  }

  const name =
    contact.name ||
    `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
    "Unknown";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to contacts
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
            {contact.companyName && (
              <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                <Building2 className="h-4 w-4" />
                {contact.companyName}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Contact info sidebar */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm text-blue-600 hover:underline truncate"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate"
                >
                  {contact.website}
                </a>
              </div>
            )}
            {(contact.address1 || contact.city || contact.state) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-600">
                  {[contact.address1, contact.city, contact.state, contact.postalCode, contact.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {contact.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-600">
                  Born {formatDate(contact.dateOfBirth)}
                </span>
              </div>
            )}

            {/* Tags */}
            <Separator />
            <TagsSection contact={contact} />

            {/* Custom Fields */}
            {contact.customFields && contact.customFields.length > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Custom Fields</span>
                  <div className="mt-2 space-y-2">
                    {contact.customFields.map((field) => (
                      <div key={field.id} className="text-sm">
                        <span className="text-gray-400 text-xs">{field.id}</span>
                        <p className="text-gray-700">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Source */}
            {contact.source && (
              <>
                <Separator />
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Source</span>
                  <p className="text-sm text-gray-700 mt-1">{contact.source}</p>
                </div>
              </>
            )}

            {/* Dates */}
            <Separator />
            <div className="space-y-1 text-xs text-gray-400">
              {contact.dateAdded && <p>Added {formatDate(contact.dateAdded)}</p>}
              {contact.dateUpdated && <p>Updated {formatDate(contact.dateUpdated)}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Activity tabs */}
        <div className="col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                {/* Quick info cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Email</p>
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400">Not provided</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Phone</p>
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {contact.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400">Not provided</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Full details card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <DetailRow label="First Name" value={contact.firstName} />
                      <DetailRow label="Last Name" value={contact.lastName} />
                      <DetailRow label="Company" value={contact.companyName} />
                      <DetailRow label="Website" value={contact.website} />
                      <DetailRow label="Address" value={contact.address1} />
                      <DetailRow
                        label="City / State"
                        value={
                          [contact.city, contact.state].filter(Boolean).join(", ") || undefined
                        }
                      />
                      <DetailRow label="Postal Code" value={contact.postalCode} />
                      <DetailRow label="Country" value={contact.country} />
                      <DetailRow label="Source" value={contact.source} />
                      <DetailRow
                        label="Date of Birth"
                        value={contact.dateOfBirth ? formatDate(contact.dateOfBirth) : undefined}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesTab contactId={contact.id} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <TasksTab contactId={contact.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value || "\u2014"}</p>
    </div>
  );
}
