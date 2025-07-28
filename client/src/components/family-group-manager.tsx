import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";

export function FamilyGroupManager() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any | null>(null);

  // Busca núcleos familiares e usuário logado
  useEffect(() => {
    fetch("/api/family-groups")
      .then(res => res.json())
      .then(setGroups)
      .catch(() => setError("Erro ao buscar núcleos familiares"));
    fetch("/api/user")
      .then(res => res.json())
      .then(setUser)
      .catch(() => {});
    // Busca convites recebidos
    fetch("/api/family-group-invites")
      .then(res => res.json())
      .then(data => {
        // Para cada convite, busca o nome do núcleo
        Promise.all(data.map(async (invite: any) => {
          try {
            const groupRes = await fetch(`/api/family-groups/${invite.familyGroupId}`);
            if (groupRes.ok) {
              const group = await groupRes.json();
              return { ...invite, groupName: group.name };
            }
          } catch {}
          return { ...invite, groupName: "Núcleo desconhecido" };
        })).then(setInvites);
      })
      .catch(() => {});
  }, []);
  // Envia convite para núcleo
  const handleInvite = async () => {
    if (!selectedGroup || !inviteEmail) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/family-groups/${selectedGroup.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Erro ao enviar convite");
      }
      
      setInviteEmail("");
      setError("Convite enviado com sucesso!");
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => setError(""), 3000);
    } catch (error: any) {
      setError(error.message || "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  // Aceitar convite
  const handleAcceptInvite = async (inviteId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/family-group-invites/${inviteId}/accept`, { method: "POST" });
      if (!res.ok) throw new Error();
      setInvites(invites.filter(i => i.id !== inviteId));
      window.location.reload();
    } catch {
      setError("Erro ao aceitar convite");
    } finally {
      setLoading(false);
    }
  };

  // Recusar convite
  const handleRejectInvite = async (inviteId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/family-group-invites/${inviteId}/reject`, { method: "POST" });
      if (!res.ok) throw new Error();
      setInvites(invites.filter(i => i.id !== inviteId));
    } catch {
      setError("Erro ao recusar convite");
    } finally {
      setLoading(false);
    }
  };

  // Seleciona núcleo atual do usuário
  useEffect(() => {
    if (user && user.familyGroupId) {
      const group = groups.find(g => g.id === user.familyGroupId);
      setSelectedGroup(group || null);
      if (group) fetchMembers(group.id);
    }
  }, [user, groups]);

  // Busca membros do núcleo
  const fetchMembers = async (groupId: string) => {
    try {
      const res = await fetch(`/api/family-groups/${groupId}/members`);
      const data = await res.json();
      setMembers(data);
    } catch {
      setMembers([]);
    }
  };

  // Cria novo núcleo
  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName })
      });
      if (!res.ok) throw new Error();
      const group = await res.json();
      setGroups(prev => [...prev, group]);
      setNewGroupName("");
    } catch {
      setError("Erro ao criar núcleo");
    } finally {
      setLoading(false);
    }
  };

  // Entrar em núcleo
  const handleJoin = async (groupId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/family-groups/${groupId}/join`, { method: "POST" });
      if (!res.ok) throw new Error();
      setUser((u: any) => ({ ...u, familyGroupId: groupId }));
      const group = groups.find(g => g.id === groupId);
      setSelectedGroup(group || null);
      fetchMembers(groupId);
    } catch {
      setError("Erro ao entrar no núcleo");
    } finally {
      setLoading(false);
    }
  };

  // Sair do núcleo
  const handleLeave = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/family-groups/${selectedGroup.id}/leave`, { method: "POST" });
      if (!res.ok) throw new Error();
      setUser((u: any) => ({ ...u, familyGroupId: null }));
      setSelectedGroup(null);
      setMembers([]);
    } catch {
      setError("Erro ao sair do núcleo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-4">
      <h2 className="text-lg font-bold mb-2">Núcleos familiares</h2>
      
      {error && (
        <div className={`text-sm p-2 rounded mb-4 ${error.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}
      
      <div className="flex gap-2 mb-2">
        <Input
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          placeholder="Nome do núcleo"
        />
        <Button onClick={handleCreate} disabled={loading || !newGroupName}>
          Criar
        </Button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}

      {selectedGroup ? (
        <div className="mb-2">
          <div className="font-semibold">Núcleo atual: {selectedGroup.name}</div>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleLeave} disabled={loading}>
            Sair do núcleo
          </Button>
          <div className="mt-4">
            <div className="font-semibold mb-1">Membros:</div>
            <ul>
              {members.map((m: any) => (
                <li key={m.id}>{m.firstName || m.email}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <div className="font-semibold mb-1">Convidar por e-mail:</div>
            <div className="flex gap-2 mb-2">
              <Input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="E-mail do convidado"
              />
              <Button onClick={handleInvite} disabled={loading || !inviteEmail}>
                Convidar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-1">Selecione um núcleo para participar:</div>
          <ul>
            {groups.map(group => (
              <li key={group.id} className="mb-1 flex items-center gap-2">
                <span className="font-semibold">{group.name}</span>
                <Button size="sm" onClick={() => handleJoin(group.id)} disabled={loading}>
                  Entrar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Convites recebidos */}
      {invites.length > 0 && (
        <div className="mt-6">
          <div className="font-semibold mb-1">Convites recebidos:</div>
          <ul>
            {invites.map(invite => (
              <li key={invite.id} className="mb-2 flex items-center gap-2">
                <span>Núcleo: {invite.groupName || invite.familyGroupId}</span>
                <Button size="sm" variant="outline" onClick={() => handleAcceptInvite(invite.id)} disabled={loading}>
                  Aceitar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleRejectInvite(invite.id)} disabled={loading}>
                  Recusar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
