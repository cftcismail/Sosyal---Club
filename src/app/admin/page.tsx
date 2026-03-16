'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    Calendar,
    Briefcase,
    Check,
    CheckSquare,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    Key,
    Pencil,
    Search,
    Shield,
    Square,
    Trash2,
    UserCheck,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface Stats {
    total_users: number;
    total_clubs: number;
    total_posts: number;
    upcoming_events: number;
    pending_clubs: any[];
}

interface DeletionRequest {
    id: string;
    club_id: string;
    club_name: string;
    club_slug: string;
    requester_name: string;
    reviewer_name?: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at?: string;
}

type AdminTab = 'dashboard' | 'users' | 'clubs' | 'posts' | 'events' | 'polls' | 'departments';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [userDeptFilter, setUserDeptFilter] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [clubs, setClubs] = useState<any[]>([]);
    const [clubSearch, setClubSearch] = useState('');
    const [clubStatusFilter, setClubStatusFilter] = useState('');
    const [loadingClubs, setLoadingClubs] = useState(false);
    const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
    const [loadingDeletionRequests, setLoadingDeletionRequests] = useState(false);
    const [deletionRequestSearch, setDeletionRequestSearch] = useState('');
    const [deletionRequestStatusFilter, setDeletionRequestStatusFilter] = useState('');
    const [selectedDeletionRequests, setSelectedDeletionRequests] = useState<string[]>([]);
    const [deletionRequestModal, setDeletionRequestModal] = useState<DeletionRequest | null>(null);
    const [processingBulk, setProcessingBulk] = useState(false);

    // Department management
    const [deptList, setDeptList] = useState<any[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [editDeptModal, setEditDeptModal] = useState<{ id?: string; oldName: string; newName: string } | null>(null);
    const [savingDept, setSavingDept] = useState(false);
    const [deptReportModal, setDeptReportModal] = useState<{ name: string; users: any[] } | null>(null);
    const [loadingDeptReport, setLoadingDeptReport] = useState(false);
    const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
    const deptFileRef = useRef<HTMLInputElement | null>(null);
    const [newDeptName, setNewDeptName] = useState('');

    // Titles
    const [titleList, setTitleList] = useState<{ id: string; name: string; created_at: string }[]>([]);
    const [loadingTitles, setLoadingTitles] = useState(false);
    const [editTitleModal, setEditTitleModal] = useState<{ id: string; oldName: string; newName: string } | null>(null);
    const [savingTitle, setSavingTitle] = useState(false);
    const titleFileRef = useRef<HTMLInputElement | null>(null);
    const [newTitleName, setNewTitleName] = useState('');

    // Role management
    const [roleModal, setRoleModal] = useState<{ userId: string; userName: string; currentRole: string } | null>(null);
    const [newRole, setNewRole] = useState('');
    const [savingRole, setSavingRole] = useState(false);

    const [posts, setPosts] = useState<any[]>([]);
    const [postSearch, setPostSearch] = useState('');
    const [loadingPosts, setLoadingPosts] = useState(false);

    const [events, setEvents] = useState<any[]>([]);
    const [eventSearch, setEventSearch] = useState('');
    const [loadingEvents, setLoadingEvents] = useState(false);

    const [polls, setPolls] = useState<any[]>([]);
    const [pollSearch, setPollSearch] = useState('');
    const [loadingPolls, setLoadingPolls] = useState(false);

    const [passwordModal, setPasswordModal] = useState<{ userId: string; userName: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            const user = session?.user as any;
            if (user?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            loadStats();
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        if (activeTab === 'dashboard') loadDeletionRequests();
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'clubs') {
            loadClubs();
            loadDeletionRequests();
        }
        if (activeTab === 'posts') loadPosts();
        if (activeTab === 'events') loadEvents();
        if (activeTab === 'polls') loadPolls();
        if (activeTab === 'departments') {
            loadDepartments();
            loadTitles();
        }
    }, [activeTab, userDeptFilter, userRoleFilter, clubStatusFilter, status]);

    const loadStats = async () => {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) setStats(data.data);
        setLoading(false);
    };

    const loadUsers = async () => {
        setLoadingUsers(true);
        const params = new URLSearchParams();
        if (userSearch) params.set('search', userSearch);
        if (userDeptFilter) params.set('department', userDeptFilter);
        if (userRoleFilter) params.set('role', userRoleFilter);

        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        if (data.success) {
            setUsers(data.data.users);
            setDepartments(data.data.departments);
        }
        setLoadingUsers(false);
    };

    const loadClubs = async () => {
        setLoadingClubs(true);
        const params = new URLSearchParams();
        if (clubSearch) params.set('search', clubSearch);
        if (clubStatusFilter) params.set('status', clubStatusFilter);

        const res = await fetch(`/api/admin/clubs?${params}`);
        const data = await res.json();
        if (data.success) setClubs(data.data);
        setLoadingClubs(false);
    };

    const loadDeletionRequests = async () => {
        setLoadingDeletionRequests(true);
        const res = await fetch('/api/admin/club-deletion-requests');
        const data = await res.json();
        if (data.success) setDeletionRequests(data.data);
        setLoadingDeletionRequests(false);
    };

    const loadPosts = async () => {
        setLoadingPosts(true);
        const params = new URLSearchParams();
        if (postSearch) params.set('search', postSearch);

        const res = await fetch(`/api/admin/posts?${params}`);
        const data = await res.json();
        if (data.success) setPosts(data.data);
        setLoadingPosts(false);
    };

    const loadEvents = async () => {
        setLoadingEvents(true);
        const params = new URLSearchParams();
        if (eventSearch) params.set('search', eventSearch);

        const res = await fetch(`/api/admin/events?${params}`);
        const data = await res.json();
        if (data.success) setEvents(data.data);
        setLoadingEvents(false);
    };

    const loadPolls = async () => {
        setLoadingPolls(true);
        const params = new URLSearchParams();
        if (pollSearch) params.set('search', pollSearch);

        const res = await fetch(`/api/admin/polls?${params}`);
        const data = await res.json();
        if (data.success) setPolls(data.data);
        setLoadingPolls(false);
    };

    const loadDepartments = async () => {
        setLoadingDepts(true);
        const res = await fetch('/api/admin/departments');
        const data = await res.json();
        if (data.success) setDeptList(data.data);
        setLoadingDepts(false);
    };

    const toggleDeptSelection = (id: string) => {
        setSelectedDeptIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleDeptCsvUpload = async (file: File | null) => {
        if (!file) return;
        const text = await file.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        // treat each line as a department name or CSV with first column as name
        const names = lines.map(l => l.split(',')[0].replace(/^"|"$/g, '').trim()).filter(Boolean);
        if (names.length === 0) return alert('Dosyada departman bulunamadı.');
        const res = await fetch('/api/admin/departments/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ names }) });
        const data = await res.json();
        alert(data.message || data.error);
        await loadDepartments();
    };

    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) return;
        setSavingDept(true);
        const res = await fetch('/api/admin/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newDeptName }),
        });
        const data = await res.json();
        setSavingDept(false);
        if (data.success) {
            setNewDeptName('');
            await loadDepartments();
        } else {
            alert(data.error || 'Departman eklenemedi.');
        }
    };

    const handleDeptBulkDelete = async () => {
        if (selectedDeptIds.length === 0) return;
        const choice = prompt(`Seçili ${selectedDeptIds.length} departmanı silmek istiyorsunuz.\n1) Boşalt\n2) Yeniden ata (hedef departman adı girin)\n\nLütfen 1 veya hedef departman adını yazın:`);
        if (choice === null) return;
        const trimmed = String(choice).trim();
        const body: any = { ids: selectedDeptIds };
        if (trimmed === '1' || trimmed === '') body.clear_users = true; else body.reassign_to = trimmed;
        const res = await fetch('/api/admin/departments/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        alert(data.message || data.error);
        setSelectedDeptIds([]);
        await Promise.all([loadDepartments(), loadUsers()]);
    };

    const loadTitles = async () => {
        setLoadingTitles(true);
        const res = await fetch('/api/admin/titles');
        const data = await res.json();
        if (data.success) setTitleList(data.data);
        setLoadingTitles(false);
    };

    const handleRenameDept = async () => {
        if (!editDeptModal || !editDeptModal.newName.trim()) return;
        setSavingDept(true);
        const res = await fetch('/api/admin/departments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editDeptModal.id, new_name: editDeptModal.newName }),
        });
        const data = await res.json();
        setSavingDept(false);
        if (data.success) {
            setEditDeptModal(null);
            await Promise.all([loadDepartments(), loadUsers()]);
        } else {
            alert(data.error);
        }
    };

    const handleAddTitle = async (name: string) => {
        if (!name.trim()) return;
        setSavingTitle(true);
        const res = await fetch('/api/admin/titles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        setSavingTitle(false);
        if (data.success) await loadTitles(); else alert(data.error);
    };

    const handleTitleCsvUpload = async (file: File | null) => {
        if (!file) return;
        const text = await file.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const names = lines.map(l => l.split(',')[0].replace(/^"|"$/g, '').trim()).filter(Boolean);
        if (names.length === 0) return alert('Dosyada unvan bulunamadı.');

        const res = await fetch('/api/admin/titles/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) await loadTitles();
    };

    const handleRenameTitle = async () => {
        if (!editTitleModal || !editTitleModal.newName.trim()) return;
        setSavingTitle(true);
        const res = await fetch('/api/admin/titles', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editTitleModal.id, new_name: editTitleModal.newName }),
        });
        const data = await res.json();
        setSavingTitle(false);
        if (data.success) {
            setEditTitleModal(null);
            await loadTitles();
        } else alert(data.error);
    };

    const handleDeleteTitle = async (id: string, name: string) => {
        if (!confirm(`"${name}" unvanını kaldırmak istediğinize emin misiniz? Bu unvanı kullananların unvanı silinecek.`)) return;
        const res = await fetch('/api/admin/titles', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, clear_users: true }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) await loadTitles();
    };

    const handleDeleteDept = async (id: string, name: string) => {
        const choice = prompt(`"${name}" departmanını kaldırmak istiyorsunuz.\n
1) Boşalt (kullanıcı departmanları temizlenecek)\n2) Yeniden ata (hedef departman adını girin)\n\nLütfen 1 veya hedef departman adını yazın (iptal için boş bırakın):`);
        if (choice === null) return; // cancelled
        const trimmed = String(choice).trim();
        let body: any = { id };
        if (trimmed === '1' || trimmed === '') {
            if (!confirm(`"${name}" departmanını kaldırıp kullanıcı departmanlarını temizlemek istediğinize emin misiniz?`)) return;
            body.clear_users = true;
        } else {
            // user provided a target department name
            if (!confirm(`"${name}" departmanını kaldırıp kullanıcıları "${trimmed}" departmanına atamak istiyor musunuz?`)) return;
            body.reassign_to = trimmed;
        }

        const res = await fetch('/api/admin/departments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) {
            await Promise.all([loadDepartments(), loadUsers()]);
        }
    };

    const openDeptReport = async (deptName: string) => {
        setDeptReportModal({ name: deptName, users: [] });
        setLoadingDeptReport(true);
        try {
            const res = await fetch(`/api/admin/users?department=${encodeURIComponent(deptName)}`);
            const data = await res.json();
            if (data.success) {
                setDeptReportModal({ name: deptName, users: data.data.users });
            } else {
                setDeptReportModal({ name: deptName, users: [] });
                alert(data.error || 'Rapor yüklenemedi.');
            }
        } catch (e) {
            setDeptReportModal({ name: deptName, users: [] });
            alert('Rapor yüklenirken hata oluştu.');
        }
        setLoadingDeptReport(false);
    };

    const exportDeptReportCsv = (users: any[], deptName: string) => {
        if (!users || users.length === 0) {
            alert('Dışa aktarılacak kullanıcı bulunamadı.');
            return;
        }
        const header = ['Ad', 'E-posta', 'Rol', 'Departman', 'Unvan', 'Kulüp Sayısı', 'Gönderi Sayısı', 'Kayıt Tarihi'];
        const rows = users.map(u => [u.name || '', u.email || '', u.role || '', u.department || '', u.title || '', u.club_count ?? 0, u.post_count ?? 0, new Date(u.created_at).toLocaleString()]);
        const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${deptName.replace(/[^a-z0-9_-]/gi, '_')}_users.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleChangeRole = async () => {
        if (!roleModal || !newRole) return;
        setSavingRole(true);
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: roleModal.userId, role: newRole }),
        });
        const data = await res.json();
        setSavingRole(false);
        if (data.success) {
            setRoleModal(null);
            setNewRole('');
            await loadUsers();
        } else {
            alert(data.error);
        }
    };

    const handleClubAction = async (clubId: string, action: 'active' | 'archived') => {
        const res = await fetch(`/api/clubs/${clubId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action }),
        });
        const data = await res.json();
        if (data.success) {
            await Promise.all([loadStats(), loadClubs()]);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`${userName} kullanıcısını silmek istediğinize emin misiniz?`)) return;

        const res = await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) {
            await Promise.all([loadUsers(), loadStats()]);
        }
    };

    const handleDeleteClub = async (clubId: string, clubName: string) => {
        if (!confirm(`${clubName} kulübünü silmek istediğinize emin misiniz?`)) return;

        const res = await fetch('/api/admin/clubs', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ club_id: clubId }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) {
            await Promise.all([loadClubs(), loadDeletionRequests(), loadStats()]);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;

        const res = await fetch('/api/admin/posts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: postId }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) {
            await Promise.all([loadPosts(), loadStats()]);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;

        const res = await fetch('/api/admin/events', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) {
            await Promise.all([loadEvents(), loadStats()]);
        }
    };

    const handleDeletePoll = async (pollId: string) => {
        if (!confirm('Bu anketi silmek istediğinize emin misiniz?')) return;

        const res = await fetch('/api/admin/polls', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poll_id: pollId }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) {
            await loadPolls();
        }
    };

    const handleDeletionRequest = async (requestId: string, requestStatus: 'approved' | 'rejected') => {
        const message = requestStatus === 'approved'
            ? 'Bu silme talebini onaylayıp kulübü silmek istediğinize emin misiniz?'
            : 'Bu silme talebini reddetmek istediğinize emin misiniz?';
        if (!confirm(message)) return;

        const res = await fetch('/api/admin/club-deletion-requests', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: requestId, status: requestStatus }),
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (data.success) {
            setDeletionRequestModal(null);
            setSelectedDeletionRequests([]);
            await Promise.all([loadDeletionRequests(), loadClubs(), loadStats()]);
        }
    };

    const handleBulkDeletionRequest = async (requestStatus: 'approved' | 'rejected') => {
        if (selectedDeletionRequests.length === 0) return;

        const message = requestStatus === 'approved'
            ? `${selectedDeletionRequests.length} silme talebini onaylayıp kulüpleri silmek istediğinize emin misiniz?`
            : `${selectedDeletionRequests.length} silme talebini reddetmek istediğinize emin misiniz?`;
        if (!confirm(message)) return;

        setProcessingBulk(true);
        let successCount = 0;
        let failCount = 0;

        for (const requestId of selectedDeletionRequests) {
            try {
                const res = await fetch('/api/admin/club-deletion-requests', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ request_id: requestId, status: requestStatus }),
                });
                const data = await res.json();
                if (data.success) successCount++;
                else failCount++;
            } catch {
                failCount++;
            }
        }

        setProcessingBulk(false);
        setSelectedDeletionRequests([]);
        alert(`${successCount} talep işlendi${failCount > 0 ? `, ${failCount} talep başarısız` : ''}`);
        await Promise.all([loadDeletionRequests(), loadClubs(), loadStats()]);
    };

    const toggleDeletionRequestSelection = (requestId: string) => {
        setSelectedDeletionRequests(prev =>
            prev.includes(requestId)
                ? prev.filter(id => id !== requestId)
                : [...prev, requestId]
        );
    };

    const selectAllPendingDeletionRequests = () => {
        const pendingIds = filteredDeletionRequests.filter(r => r.status === 'pending').map(r => r.id);
        setSelectedDeletionRequests(prev =>
            prev.length === pendingIds.length ? [] : pendingIds
        );
    };

    const filteredDeletionRequests = deletionRequests.filter(request => {
        const matchesSearch = !deletionRequestSearch ||
            request.club_name?.toLowerCase().includes(deletionRequestSearch.toLowerCase()) ||
            request.requester_name?.toLowerCase().includes(deletionRequestSearch.toLowerCase()) ||
            request.reason?.toLowerCase().includes(deletionRequestSearch.toLowerCase());
        const matchesStatus = !deletionRequestStatusFilter || request.status === deletionRequestStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSetPassword = async () => {
        if (!passwordModal || !newPassword || newPassword.length < 6) return;

        setSavingPassword(true);
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: passwordModal.userId, password: newPassword }),
        });
        const data = await res.json();
        setSavingPassword(false);

        if (data.success) {
            alert('Şifre başarıyla değiştirildi.');
            setPasswordModal(null);
            setNewPassword('');
        }
    };

    const handleToggleActive = async (userId: string, currentActive: boolean) => {
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_active: !currentActive }),
        });
        const data = await res.json();
        if (data.success) loadUsers();
    };

    const exportCSV = () => {
        const header = 'Ad,E-posta,Departman,Rol,Kulüp Sayısı,Gönderi Sayısı,Kayıt Tarihi\n';
        const rows = users.map((user) =>
            `"${user.name}","${user.email}","${user.department || ''}","${user.role}",${user.club_count},${user.post_count},"${formatDate(user.created_at)}"`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'kullanici-raporu.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const downloadPersonsSample = () => {
        const header = ['email', 'name', 'department', 'title'];
        const sample = [['alice@example.com', 'Alice Örnek', 'Mühendislik', 'Mühendis']];
        const csv = [header, ...sample].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'persons_sample.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const downloadDepartmentSample = () => {
        const header = ['name'];
        const sample = [['İnsan Kaynakları'], ['Yazılım Geliştirme']];
        const csv = [header, ...sample].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'departments_sample.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const downloadTitleSample = () => {
        const header = ['name'];
        const sample = [['Mühendis'], ['Takım Lideri']];
        const csv = [header, ...sample].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'titles_sample.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const parseCsvLine = (line: string) => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
                result.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        result.push(cur);
        return result.map(s => s.trim());
    };

    const handlePersonsCsvUpload = async (file: File | null) => {
        if (!file) return;
        const text = await file.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return alert('Dosya boş.');
        const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
        const required = ['email'];
        if (!required.every(r => header.includes(r))) return alert('CSV başlığı en azından "email" sütununu içermelidir.');

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.length === 0) continue;
            const obj: any = {};
            for (let c = 0; c < header.length; c++) obj[header[c]] = cols[c] ?? '';
            rows.push({ email: (obj.email || '').trim(), name: (obj.name || '').trim(), department: (obj.department || '').trim(), title: (obj.title || '').trim() });
        }
        if (rows.length === 0) return alert('İşlenecek satır bulunamadı.');

        const res = await fetch('/api/admin/users/bulk-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
        const data = await res.json();
        if (data.success) {
            alert(data.message || 'İşlem tamamlandı.');
            await Promise.all([loadDepartments(), loadTitles(), loadUsers()]);
        } else {
            alert(data.error || 'Hata oluştu.');
        }
    };

    const submitSearch = (event: FormEvent, loader: () => Promise<void> | void) => {
        event.preventDefault();
        loader();
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        { label: 'Toplam Kullanıcı', value: stats.total_users, icon: Users, color: 'bg-blue-500' },
        { label: 'Aktif Kulüp', value: stats.total_clubs, icon: UserCheck, color: 'bg-green-500' },
        { label: 'Toplam Gönderi', value: stats.total_posts, icon: FileText, color: 'bg-fuchsia-500' },
        { label: 'Yaklaşan Etkinlik', value: stats.upcoming_events, icon: Calendar, color: 'bg-orange-500' },
    ];

    const pendingDeletionRequests = filteredDeletionRequests.filter((request) => request.status === 'pending');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="surface p-5 sm:p-6 mb-8 animate-fade-in">
                <p className="kicker mb-1">Yönetim Merkezi</p>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-orange-500" />
                    Admin Paneli
                </h1>
                <p className="text-gray-500 mt-1">Platform verileri, silme işlemleri ve yönetim ekranları.</p>
            </div>

            <div className="surface p-1.5 mb-6 flex flex-wrap gap-1">
                {([
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'users', label: 'Kullanıcılar' },
                    { key: 'clubs', label: 'Kulüpler' },
                    { key: 'departments', label: 'Departmanlar' },
                    { key: 'posts', label: 'Gönderiler' },
                    { key: 'events', label: 'Etkinlikler' },
                    { key: 'polls', label: 'Anketler' },
                ] as const).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition ${activeTab === key ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="surface p-5 interactive-lift">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                                        <p className="text-xs text-gray-500">{label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="card">
                            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                <h2 className="text-lg font-bold text-gray-900">Onay Bekleyen Kulüpler</h2>
                                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {stats.pending_clubs.length}
                                </span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {stats.pending_clubs.length === 0 ? (
                                    <div className="p-6 text-sm text-gray-500">Onay bekleyen kulüp yok.</div>
                                ) : stats.pending_clubs.map((club: any) => (
                                    <div key={club.id} className="p-5 flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{club.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{club.description || 'Açıklama girilmemiş.'}</p>
                                            <p className="text-xs text-gray-400 mt-2">Başvuran: {club.creator_name} · {formatDate(club.created_at)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleClubAction(club.id, 'active')}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                                            >
                                                <Check className="w-4 h-4" /> Onayla
                                            </button>
                                            <button
                                                onClick={() => handleClubAction(club.id, 'archived')}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                            >
                                                <X className="w-4 h-4" /> Reddet
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-amber-600" />
                                <h2 className="text-lg font-bold text-gray-900">Bekleyen Silme Talepleri</h2>
                                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {pendingDeletionRequests.length}
                                </span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {pendingDeletionRequests.length === 0 ? (
                                    <div className="p-6 text-sm text-gray-500">Bekleyen silme talebi yok.</div>
                                ) : pendingDeletionRequests.map((request) => (
                                    <div key={request.id} className="p-5 flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{request.club_name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">Talep sahibi: {request.requester_name}</p>
                                            <p className="text-xs text-gray-400 mt-2">{request.reason || 'Sebep girilmedi.'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDeletionRequest(request.id, 'approved')}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" /> Sil
                                            </button>
                                            <button
                                                onClick={() => handleDeletionRequest(request.id, 'rejected')}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                                            >
                                                <X className="w-4 h-4" /> Reddet
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="surface p-4">
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Kullanıcılara Toplu Unvan/Departman Yükle (Excel/CSV)</h4>
                            <div className="flex items-center gap-2">
                                <input id="personsFileInput" type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handlePersonsCsvUpload(e.target.files?.[0] ?? null)} />
                                <button onClick={() => (document.getElementById('personsFileInput') as HTMLInputElement)?.click()} className="px-3 py-2 bg-blue-50 text-blue-700 rounded">Dosya Yükle</button>
                                <button onClick={downloadPersonsSample} className="px-3 py-2 bg-gray-50 text-gray-700 rounded">Örnek Excel (CSV) İndir</button>
                                <span className="text-xs text-gray-500">Beklenen sütunlar: <strong>email</strong>, <strong>name</strong> (opsiyonel), <strong>department</strong>, <strong>title</strong></span>
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-3">
                            <form onSubmit={(event) => submitSearch(event, loadUsers)} className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={userSearch}
                                    onChange={(event) => setUserSearch(event.target.value)}
                                    placeholder="İsim, e-posta veya departman ara..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                />
                            </form>
                            <select
                                value={userDeptFilter}
                                onChange={(event) => setUserDeptFilter(event.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Tüm Departmanlar</option>
                                {departments.map((department) => (
                                    <option key={department} value={department}>{department}</option>
                                ))}
                            </select>
                            <select
                                value={userRoleFilter}
                                onChange={(event) => setUserRoleFilter(event.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Tüm Roller</option>
                                <option value="admin">Admin</option>
                                <option value="club_admin">Kulüp Yöneticisi</option>
                                <option value="member">Üye</option>
                            </select>
                            <button
                                onClick={exportCSV}
                                className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                            >
                                <Download className="w-4 h-4" /> CSV
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kullanıcı</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Departman</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Kulüp</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Gönderi</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Durum</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingUsers ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Kullanıcı bulunamadı.</td>
                                        </tr>
                                    ) : users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs overflow-hidden">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.name?.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{user.department || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : user.role === 'club_admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {user.role === 'admin' ? 'Admin' : user.role === 'club_admin' ? 'Kulüp Yöneticisi' : 'Üye'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{user.club_count}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{user.post_count}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleActive(user.id, user.is_active)}
                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                                                >
                                                    {user.is_active ? 'Aktif' : 'Pasif'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setRoleModal({ userId: user.id, userName: user.name, currentRole: user.role }); setNewRole(user.role); }}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition"
                                                    >
                                                        <UserCog className="w-3 h-3" /> Rol
                                                    </button>
                                                    <button
                                                        onClick={() => setPasswordModal({ userId: user.id, userName: user.name })}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                                                    >
                                                        <Key className="w-3 h-3" /> Şifre
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'clubs' && (
                <div className="space-y-4">
                    <div className="surface p-4">
                        <div className="flex flex-col lg:flex-row gap-3">
                            <form onSubmit={(event) => submitSearch(event, loadClubs)} className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={clubSearch}
                                    onChange={(event) => setClubSearch(event.target.value)}
                                    placeholder="Kulüp adı, açıklama veya kurucu ara..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                />
                            </form>
                            <select
                                value={clubStatusFilter}
                                onChange={(event) => setClubStatusFilter(event.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Tüm Durumlar</option>
                                <option value="pending">Beklemede</option>
                                <option value="active">Aktif</option>
                                <option value="archived">Arşiv</option>
                            </select>
                        </div>
                    </div>

                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kulüp</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kurucu</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Üye</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Durum</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Silme Talebi</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingClubs ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : clubs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Kulüp bulunamadı.</td>
                                        </tr>
                                    ) : clubs.map((club) => (
                                        <tr key={club.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{club.name}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-2">{club.description || 'Açıklama yok.'}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{club.creator_name}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{club.member_count}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${club.status === 'active' ? 'bg-green-100 text-green-700' : club.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {club.status === 'active' ? 'Aktif' : club.status === 'pending' ? 'Beklemede' : 'Arşiv'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {club.deletion_request_status ? (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${club.deletion_request_status === 'pending' ? 'bg-amber-100 text-amber-700' : club.deletion_request_status === 'approved' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                                        {club.deletion_request_status === 'pending' ? 'Beklemede' : club.deletion_request_status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {club.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleClubAction(club.id, 'active')}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                                                            >
                                                                <Check className="w-3 h-3" /> Onayla
                                                            </button>
                                                            <button
                                                                onClick={() => handleClubAction(club.id, 'archived')}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                                                            >
                                                                <X className="w-3 h-3" /> Arşivle
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteClub(club.id, club.name)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-amber-600" />
                                <h2 className="text-lg font-bold text-gray-900">Kulüp Silme Talepleri</h2>
                                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {pendingDeletionRequests.length} beklemede
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        value={deletionRequestSearch}
                                        onChange={(e) => setDeletionRequestSearch(e.target.value)}
                                        placeholder="Kulüp veya talep eden ara..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                    />
                                </div>
                                <select
                                    value={deletionRequestStatusFilter}
                                    onChange={(e) => setDeletionRequestStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="">Tüm Durumlar</option>
                                    <option value="pending">Beklemede</option>
                                    <option value="approved">Onaylandı</option>
                                    <option value="rejected">Reddedildi</option>
                                </select>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedDeletionRequests.length > 0 && (
                            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                                <span className="text-sm text-blue-700 font-medium">
                                    {selectedDeletionRequests.length} talep seçildi
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleBulkDeletionRequest('approved')}
                                        disabled={processingBulk}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" /> Tümünü Onayla ve Sil
                                    </button>
                                    <button
                                        onClick={() => handleBulkDeletionRequest('rejected')}
                                        disabled={processingBulk}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4" /> Tümünü Reddet
                                    </button>
                                    <button
                                        onClick={() => setSelectedDeletionRequests([])}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition"
                                    >
                                        Seçimi Temizle
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <button
                                                onClick={selectAllPendingDeletionRequests}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                {selectedDeletionRequests.length > 0 && selectedDeletionRequests.length === pendingDeletionRequests.length
                                                    ? <CheckSquare className="w-4 h-4" />
                                                    : <Square className="w-4 h-4" />
                                                }
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kulüp</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Talep Eden</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sebep</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Durum</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingDeletionRequests ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : filteredDeletionRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Silme talebi bulunamadı.</td>
                                        </tr>
                                    ) : filteredDeletionRequests.map((request) => (
                                        <tr key={request.id} className={`hover:bg-gray-50 ${selectedDeletionRequests.includes(request.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                {request.status === 'pending' && (
                                                    <button
                                                        onClick={() => toggleDeletionRequestSelection(request.id)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        {selectedDeletionRequests.includes(request.id)
                                                            ? <CheckSquare className="w-4 h-4 text-primary-600" />
                                                            : <Square className="w-4 h-4" />
                                                        }
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.club_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{request.requester_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{request.reason || 'Sebep girilmedi.'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(request.created_at)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    request.status === 'approved' ? 'bg-red-100 text-red-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {request.status === 'pending' ? 'Beklemede' : request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setDeletionRequestModal(request)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                                                    >
                                                        <Eye className="w-3 h-3" /> Detay
                                                    </button>
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDeletionRequest(request.id, 'approved')}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition font-medium"
                                                            >
                                                                <Check className="w-3 h-3" /> Onayla
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletionRequest(request.id, 'rejected')}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                                                            >
                                                                <X className="w-3 h-3" /> Reddet
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="space-y-4">
                    <div className="surface p-4">
                        <form onSubmit={(event) => submitSearch(event, loadPosts)} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={postSearch}
                                onChange={(event) => setPostSearch(event.target.value)}
                                placeholder="Gönderi içeriği, kulüp veya yazar ara..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none text-sm"
                            />
                        </form>
                    </div>

                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Gönderi</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kulüp</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Yazar</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Etkileşim</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingPosts ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : posts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Gönderi bulunamadı.</td>
                                        </tr>
                                    ) : posts.map((post) => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xl">
                                                <p className="line-clamp-2">{post.content}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatDateTime(post.created_at)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{post.club_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{post.author_name}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{post.like_count} beğeni · {post.comment_count} yorum</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'events' && (
                <div className="space-y-4">
                    <div className="surface p-4">
                        <form onSubmit={(event) => submitSearch(event, loadEvents)} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={eventSearch}
                                onChange={(event) => setEventSearch(event.target.value)}
                                placeholder="Etkinlik, kulüp veya oluşturan kişi ara..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none text-sm"
                            />
                        </form>
                    </div>

                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Etkinlik</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kulüp</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Oluşturan</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Katılım</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingEvents ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : events.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Etkinlik bulunamadı.</td>
                                        </tr>
                                    ) : events.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <p className="font-medium text-gray-900">{event.title}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatDateTime(event.start_time)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{event.club_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{event.creator_name}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">
                                                {event.attending_count} katılıyor · {event.maybe_count} belki · {event.declined_count} katılmıyor
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'polls' && (
                <div className="space-y-4">
                    <div className="surface p-4">
                        <form onSubmit={(event) => submitSearch(event, loadPolls)} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={pollSearch}
                                onChange={(event) => setPollSearch(event.target.value)}
                                placeholder="Anket sorusu, kulüp veya yazar ara..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 outline-none text-sm"
                            />
                        </form>
                    </div>

                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Anket</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kulüp</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Yazar</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Oy</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingPolls ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : polls.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Anket bulunamadı.</td>
                                        </tr>
                                    ) : polls.map((poll) => (
                                        <tr key={poll.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <p className="font-medium text-gray-900">{poll.question}</p>
                                                <p className="text-xs text-gray-400 mt-1">{poll.ends_at ? `Bitiş: ${formatDateTime(poll.ends_at)}` : 'Süresiz'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{poll.club_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{poll.author_name}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{poll.vote_count} oy · {poll.option_count} seçenek</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeletePoll(poll.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'departments' && (
                <div className="space-y-4">
                    <div className="card">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900">Departmanlar</h2>
                                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {deptList.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input ref={deptFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleDeptCsvUpload(e.target.files?.[0] ?? null)} />
                                <button onClick={loadDepartments} className="text-sm text-gray-500 hover:text-gray-700 transition">Yenile</button>
                            </div>
                        </div>
                        <div className="p-4 border-b border-gray-100 grid md:grid-cols-2 gap-3 bg-gray-50/70">
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Manuel Ekle</p>
                                <div className="flex gap-2">
                                    <input
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDepartment())}
                                        placeholder="Yeni departman adı"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={handleAddDepartment}
                                        disabled={savingDept || !newDeptName.trim()}
                                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm disabled:opacity-50"
                                    >
                                        Ekle
                                    </button>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Excel/CSV Toplu Ekle</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => deptFileRef.current?.click()}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                                    >
                                        Dosya Seç ve Yükle
                                    </button>
                                    <button
                                        onClick={downloadDepartmentSample}
                                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition"
                                    >
                                        Örnek CSV İndir
                                    </button>
                                </div>
                            </div>
                        </div>
                        {selectedDeptIds.length > 0 && (
                            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                                <span className="text-sm text-blue-700">{selectedDeptIds.length} departman seçildi</span>
                                <div className="flex gap-2">
                                    <button onClick={handleDeptBulkDelete} className="px-3 py-1 bg-red-600 text-white rounded">Seçiliyi Sil / Yeniden Ata</button>
                                    <button onClick={() => setSelectedDeptIds([])} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">Seçimi Temizle</button>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Departman</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Toplam</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Admin</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Kulüp Yön.</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Üye</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingDepts ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Yükleniyor...</td>
                                        </tr>
                                    ) : deptList.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Departman bulunamadı. Kullanıcıların departman bilgisi girilmemiş olabilir.</td>
                                        </tr>
                                    ) : deptList.map((dept) => (
                                        <tr key={dept.name} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" checked={selectedDeptIds.includes(dept.id)} onChange={() => toggleDeptSelection(dept.id)} className="mr-2" />
                                                <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center font-semibold text-gray-700">{dept.user_count}</td>
                                            <td className="px-4 py-3 text-center">
                                                {Number(dept.admin_count) > 0 ? (
                                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{dept.admin_count}</span>
                                                ) : <span className="text-gray-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {Number(dept.club_admin_count) > 0 ? (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{dept.club_admin_count}</span>
                                                ) : <span className="text-gray-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {Number(dept.member_count) > 0 ? (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{dept.member_count}</span>
                                                ) : <span className="text-gray-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setUserDeptFilter(dept.name); setActiveTab('users'); }}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                                                    >
                                                        <Users className="w-3 h-3" /> Kullanıcılar
                                                    </button>
                                                    <button
                                                        onClick={() => openDeptReport(dept.name)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                                    >
                                                        <FileText className="w-3 h-3" /> Rapor
                                                    </button>
                                                    <button
                                                        onClick={() => setEditDeptModal({ id: dept.id, oldName: dept.name, newName: dept.name })}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                                                    >
                                                        <Pencil className="w-3 h-3" /> Düzenle
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDept(dept.id, dept.name)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Kaldır
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 px-1">
                        Departmanlar kullanıcıların profil bilgilerinden alınmaktadır. &quot;Kaldır&quot; işlemi departmanı silmez, bu departmandaki kullanıcıların departman alanını boşaltır.
                    </p>
                    {/* Titles management */}
                    <div className="surface p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-gray-900">Unvanlar</h3>
                                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{titleList.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input ref={titleFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleTitleCsvUpload(e.target.files?.[0] ?? null)} />
                                <button onClick={loadTitles} className="text-sm text-gray-500 hover:text-gray-700">Yenile</button>
                            </div>
                        </div>

                        <div className="mb-3 grid md:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Manuel Ekle</p>
                                <div className="flex gap-2">
                                    <input
                                        value={newTitleName}
                                        onChange={(e) => setNewTitleName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTitle(newTitleName), setNewTitleName(''))}
                                        placeholder="Yeni unvan ekle"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                    <button
                                        onClick={() => {
                                            if (!newTitleName.trim()) return;
                                            handleAddTitle(newTitleName);
                                            setNewTitleName('');
                                        }}
                                        className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg"
                                    >
                                        Ekle
                                    </button>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Excel/CSV Toplu Ekle</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => titleFileRef.current?.click()}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                                    >
                                        Dosya Seç ve Yükle
                                    </button>
                                    <button
                                        onClick={downloadTitleSample}
                                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition"
                                    >
                                        Örnek CSV İndir
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unvan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Oluşturulma</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loadingTitles ? (
                                        <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Yükleniyor...</td></tr>
                                    ) : titleList.length === 0 ? (
                                        <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Unvan bulunamadı.</td></tr>
                                    ) : titleList.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">{t.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setEditTitleModal({ id: t.id, oldName: t.name, newName: t.name })} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-lg">Düzenle</button>
                                                    <button onClick={() => handleDeleteTitle(t.id, t.name)} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg">Sil</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {passwordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Şifre Değiştir</h3>
                        <p className="text-sm text-gray-500 mb-4">{passwordModal.userName}</p>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="Yeni şifre (min 6 karakter)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSetPassword}
                                disabled={savingPassword || newPassword.length < 6}
                                className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                            >
                                {savingPassword ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                            <button
                                onClick={() => {
                                    setPasswordModal(null);
                                    setNewPassword('');
                                }}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deptReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDeptReportModal(null)} />
                    <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">{deptReportModal.name} - Kullanıcı Raporu</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => exportDeptReportCsv(deptReportModal.users, deptReportModal.name)} className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded">CSV Dışa Aktar</button>
                                <button onClick={() => { setDeptReportModal(null); }} className="px-3 py-1 text-sm text-gray-600">Kapat</button>
                            </div>
                        </div>
                        {loadingDeptReport ? (
                            <div className="p-8 text-center">Yükleniyor...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Kullanıcı</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">E-posta</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Rol</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Kayıt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {deptReportModal.users.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Bu departmana ait kullanıcı bulunamadı.</td></tr>
                                        ) : deptReportModal.users.map((u: any) => (
                                            <tr key={u.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm">{u.name}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600">{u.email}</td>
                                                <td className="px-4 py-2 text-sm">{u.role}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{new Date(u.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Deletion Request Detail Modal */}
            {deletionRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Silme Talebi Detayı</h3>
                                <p className="text-sm text-gray-500">{deletionRequestModal.club_name}</p>
                            </div>
                            <button
                                onClick={() => setDeletionRequestModal(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className={`w-2 h-2 rounded-full ${deletionRequestModal.status === 'pending' ? 'bg-amber-500' :
                                    deletionRequestModal.status === 'approved' ? 'bg-red-500' : 'bg-gray-500'
                                    }`} />
                                <span className="text-sm font-medium text-gray-700">
                                    {deletionRequestModal.status === 'pending' ? 'Beklemede' :
                                        deletionRequestModal.status === 'approved' ? 'Onaylandı (Kulüp Silindi)' : 'Reddedildi'}
                                </span>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Talep Eden</p>
                                <p className="text-sm text-gray-900">{deletionRequestModal.requester_name}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Talep Tarihi</p>
                                <p className="text-sm text-gray-900">{formatDateTime(deletionRequestModal.created_at)}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Silme Nedeni</p>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {deletionRequestModal.reason || 'Sebep belirtilmedi.'}
                                    </p>
                                </div>
                            </div>

                            {deletionRequestModal.reviewed_at && (
                                <div className="pt-3 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">İşlem Bilgisi</p>
                                    <p className="text-sm text-gray-600">
                                        {deletionRequestModal.reviewer_name} tarafından {formatDateTime(deletionRequestModal.reviewed_at)} tarihinde işlendi
                                    </p>
                                </div>
                            )}
                        </div>

                        {deletionRequestModal.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDeletionRequest(deletionRequestModal.id, 'approved')}
                                    className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Onayla ve Kulübü Sil
                                </button>
                                <button
                                    onClick={() => handleDeletionRequest(deletionRequestModal.id, 'rejected')}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Talebi Reddet
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setDeletionRequestModal(null)}
                                className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                Kapat
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Role Change Modal */}
            {roleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-2 mb-1">
                            <UserCog className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-bold text-gray-900">Rol Değiştir</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{roleModal.userName}</p>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm mb-4"
                        >
                            <option value="member">Üye</option>
                            <option value="club_admin">Kulüp Yöneticisi</option>
                            <option value="admin">Admin</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleChangeRole}
                                disabled={savingRole || newRole === roleModal.currentRole}
                                className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                            >
                                {savingRole ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                            <button
                                onClick={() => { setRoleModal(null); setNewRole(''); }}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Edit Modal */}
            {editDeptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-5 h-5 text-amber-600" />
                            <h3 className="text-lg font-bold text-gray-900">Departmanı Düzenle</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            &quot;{editDeptModal.oldName}&quot; departmanındaki tüm kullanıcılar güncellenir.
                        </p>
                        <input
                            type="text"
                            value={editDeptModal.newName}
                            onChange={(e) => setEditDeptModal(prev => prev ? { ...prev, newName: e.target.value } : null)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameDept()}
                            placeholder="Yeni departman adı"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleRenameDept}
                                disabled={savingDept || !editDeptModal.newName.trim() || editDeptModal.newName.trim() === editDeptModal.oldName}
                                className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                            >
                                {savingDept ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                            <button
                                onClick={() => setEditDeptModal(null)}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {editTitleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="w-5 h-5 text-amber-600" />
                            <h3 className="text-lg font-bold text-gray-900">Unvanı Düzenle</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            &quot;{editTitleModal.oldName}&quot; unvanını düzenliyorsunuz.
                        </p>
                        <input
                            type="text"
                            value={editTitleModal.newName}
                            onChange={(e) => setEditTitleModal(prev => prev ? { ...prev, newName: e.target.value } : null)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameTitle()}
                            placeholder="Yeni unvan adı"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleRenameTitle}
                                disabled={savingTitle || !editTitleModal.newName.trim() || editTitleModal.newName.trim() === editTitleModal.oldName}
                                className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                            >
                                {savingTitle ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                            <button
                                onClick={() => setEditTitleModal(null)}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}