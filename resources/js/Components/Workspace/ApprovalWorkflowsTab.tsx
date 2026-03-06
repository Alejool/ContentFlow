import Button from "@/Components/common/Modern/Button";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Edit2,
  Plus,
  Save,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import CreateRoleModal from "./CreateRoleModal";
import InviteMemberModal from "./InviteMemberModal";

interface ApprovalStep {
  id?: number;
  name: string;
  role_id?: number | null;
  user_id?: number | null;
  step_order: number;
}

interface Workflow {
  id: number;
  name: string;
  is_active: boolean;
  steps: ApprovalStep[];
}

interface ApprovalWorkflowsTabProps {
  workspace: any;
  roles: any[];
  canManageWorkspace: boolean;
}

export default function ApprovalWorkflowsTab({
  workspace,
  roles: initialRoles,
  canManageWorkspace,
}: ApprovalWorkflowsTabProps) {
  const { t } = useTranslation();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState(initialRoles);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);

  const fetchWorkflows = async () => {
    if (!workspace?.id) return;
    try {
      setIsLoading(true);
      const response = await axios.get(
        route("api.v1.workspaces.approval-workflows.index", workspace.id),
      );
      // Backend returns collections in 'data' key due to ApiResponse trait wrapping lists
      setWorkflows(response.data.data || []);
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Error desconocido";
      toast.error(`Error al cargar los flujos: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [workspace.id]);

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(JSON.parse(JSON.stringify(workflow)));
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingWorkflow({
      id: 0,
      name: "Nuevo Flujo de Aprobación",
      is_active: true,
      steps: [{ name: "Primer Nivel", role_id: roles[0]?.id, step_order: 1 }],
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingWorkflow) return;

    try {
      if (editingWorkflow.id === 0) {
        await axios.post(
          route("api.v1.workspaces.approval-workflows.store", workspace.id),
          editingWorkflow,
        );
        toast.success("Flujo creado con éxito");
      } else {
        await axios.put(
          route("api.v1.workspaces.approval-workflows.update", {
            idOrSlug: workspace.id,
            workflow: editingWorkflow.id,
          }),
          editingWorkflow,
        );
        toast.success("Flujo actualizado con éxito");
      }
      setIsEditing(false);
      fetchWorkflows();
    } catch (error: any) {
      toast.error(
        "Error al guardar el flujo: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este flujo?")) return;
    try {
      await axios.delete(
        route("api.v1.workspaces.approval-workflows.destroy", {
          idOrSlug: workspace.id,
          workflow: id,
        }),
      );
      toast.success("Flujo eliminado");
      fetchWorkflows();
    } catch (error) {
      toast.error("Error al eliminar el flujo");
    }
  };

  const addStep = () => {
    if (!editingWorkflow) return;
    const newSteps = [...editingWorkflow.steps];
    newSteps.push({
      name: `Nivel ${newSteps.length + 1}`,
      role_id: roles[0]?.id,
      step_order: newSteps.length + 1,
    });
    setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (!editingWorkflow) return;
    const newSteps = editingWorkflow.steps.filter((_, i) => i !== index);
    // Reorder
    newSteps.forEach((s, i) => (s.step_order = i + 1));
    setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
  };

  const handleRoleCreated = (newRole: any) => {
    setRoles([...roles, newRole]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isEditing && editingWorkflow) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50 dark:bg-neutral-800/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingWorkflow.id === 0 ? "Crear Flujo" : "Editar Flujo"}
            </h3>
            <p className="text-sm text-gray-500">
              Configura la secuencia de aprobaciones.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Guardar Cambios
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-neutral-300 mb-2">
              Nombre del Flujo
            </label>
            <input
              type="text"
              className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500"
              value={editingWorkflow.name}
              onChange={(e) =>
                setEditingWorkflow({ ...editingWorkflow, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 dark:text-white">
                Niveles de Aprobación
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreateRoleModal(true)}
                  className="text-primary-600"
                >
                  <Shield className="w-4 h-4 mr-1" /> Nuevo Rol
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addStep}
                  className="text-primary-600"
                >
                  <Plus className="w-4 h-4 mr-1" /> Añadir Nivel
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {editingWorkflow.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col xl:flex-row items-start xl:items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800/20 border border-gray-200 dark:border-neutral-800 rounded-lg group animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      className="bg-transparent border-b border-gray-300 dark:border-neutral-700 focus:border-primary-500 outline-none px-1 py-0.5 text-sm font-medium flex-1"
                      value={step.name}
                      onChange={(e) => {
                        const newSteps = [...editingWorkflow.steps];
                        newSteps[index].name = e.target.value;
                        setEditingWorkflow({
                          ...editingWorkflow,
                          steps: newSteps,
                        });
                      }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        className="w-full sm:w-48 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md p-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        value={step.role_id || ""}
                        onChange={(e) => {
                          const newSteps = [...editingWorkflow.steps];
                          newSteps[index].role_id = e.target.value
                            ? parseInt(e.target.value)
                            : null;
                          newSteps[index].user_id = null; // Clear user if role selected
                          setEditingWorkflow({
                            ...editingWorkflow,
                            steps: newSteps,
                          });
                        }}
                      >
                        <option value="">Cualquier Rol</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-400 text-xs text-center px-1">
                        O
                      </span>
                      <select
                        className="w-full sm:w-48 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md p-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        value={step.user_id || ""}
                        onChange={(e) => {
                          const newSteps = [...editingWorkflow.steps];
                          newSteps[index].user_id = e.target.value
                            ? parseInt(e.target.value)
                            : null;
                          newSteps[index].role_id = null; // Clear role if user selected
                          setEditingWorkflow({
                            ...editingWorkflow,
                            steps: newSteps,
                          });
                        }}
                      >
                        <option value="">Cualquier Usuario</option>
                        {workspace.users?.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 shrink-0"
                      title="Eliminar nivel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <CreateRoleModal
          isOpen={showCreateRoleModal}
          onClose={() => setShowCreateRoleModal(false)}
          onSuccess={handleRoleCreated}
          workspace={workspace}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Flujos de Aprobación
          </h3>
          <p className="text-sm text-gray-500">
            Define rutas de revisión secuenciales para tus publicaciones.
          </p>
        </div>
        {canManageWorkspace && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-primary-600"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Invitar
            </Button>
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={handleCreate}
            >
              <Plus className="w-5 h-5 mr-2" /> Crear Flujo
            </Button>
          </div>
        )}
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-12 text-center">
          <div className="bg-primary-50 dark:bg-primary-900/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No hay flujos personalizados
          </h4>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            Todas las publicaciones usarán el flujo básico de una sola firma
            hasta que definas uno nuevo. Define una cadena de mando para
            revisiones más estrictas.
          </p>
          <Button
            variant="primary"
            buttonStyle="solid"
            onClick={handleCreate}
            className="shadow-lg shadow-primary-500/20"
            icon={Plus}
          >
            Configurar mi primer flujo multi-nivel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/20 text-primary-600 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {workflow.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {workflow.steps.length} niveles configurados
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(workflow)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => handleDelete(workflow.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {workflow.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 flex items-center gap-1.5">
                      {step.user_id ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      {step.name}
                    </div>
                    {idx < workflow.steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <p className="text-sm text-orange-800 dark:text-orange-300">
          <strong>Nota:</strong> Solo puede haber un flujo activo a la vez por
          workspace. El sistema usará el primer flujo activo que encuentre para
          todas las nuevas publicaciones que requieran aprobación.
        </p>
      </div>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          // Success logic if needed
        }}
        workspace={workspace}
        roles={roles}
      />
    </div>
  );
}
