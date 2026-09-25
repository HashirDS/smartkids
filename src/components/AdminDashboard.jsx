import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShieldCheck, Save } from "lucide-react";
import { API_URL, apiFetch } from "../api";

const LESSONS = [
  { key: "abc", label: "ABC" },
  { key: "numbers", label: "Numbers" },
  { key: "shapes", label: "Shapes" },
  { key: "fruits", label: "Fruits" },
  { key: "colors", label: "Colors" },
  { key: "drawing", label: "Drawing Board" },
  { key: "poems", label: "Poems" },
  { key: "flags", label: "Flags" },
  { key: "urdu", label: "Urdu Alphabet" },
  { key: "arabic", label: "Arabic Qaida" },
  { key: "islamic", label: "Islamic Studies" },
  { key: "science", label: "Science" },
  { key: "animals", label: "Animals" },
  { key: "quiz", label: "Quiz" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Lesson restriction states
  const [selectedUser, setSelectedUser] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [restrictedLessons, setRestrictedLessons] = useState([]);
  const [message, setMessage] = useState("");

  const adminFirstName = localStorage.getItem("first_name") || "Admin";
  const adminLastName = localStorage.getItem("last_name") || "";

  const COLORS = ["#22c55e", "#f97316", "#000000"];

  // ===============================
  // FETCH INITIAL DATA
  // ===============================
  useEffect(() => {
    const loadData = async () => {
      const [statsRes, usersRes, studentsRes] = await Promise.all([
        apiFetch(`${API_URL}/api/admin/stats`),
        apiFetch(`${API_URL}/api/admin/users`),
        apiFetch(`${API_URL}/api/students`),
      ]);

      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      const studentData = await studentsRes.json();
      setStudents(studentData.students || []);
      setLoading(false);
    };
    loadData();
  }, []);

  // ===============================
  // 🔑 LOAD EXISTING RESTRICTIONS
  // ===============================
  useEffect(() => {
    setMessage("");

    // 🌍 GLOBAL MODE
    if (isGlobal) {
      apiFetch(`${API_URL}/api/admin/get-global-lesson-restrictions`)
        .then((res) => res.json())
        .then((data) => {
          setRestrictedLessons(data.restricted_lessons || []);
        })
        .catch(() => setRestrictedLessons([]));
      return;
    }

    // 👤 PER USER MODE
    if (!selectedUser) {
      setRestrictedLessons([]);
      return;
    }

    apiFetch(`${API_URL}/api/admin/get-lesson-restrictions/${selectedUser}`)
      .then((res) => res.json())
      .then((data) => {
        setRestrictedLessons(data.restricted_lessons || []);
      })
      .catch(() => setRestrictedLessons([]));
  }, [selectedUser, isGlobal]);

  // ===============================
  // USER MANAGEMENT
  // ===============================
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    await apiFetch(`${API_URL}/api/admin/delete-user/${id}`, { method: "DELETE" });
  };

  const toggleRestrict = async (id) => {
    await apiFetch(`${API_URL}/api/admin/toggle-restrict/${id}`, { method: "PUT" });
  };

  // ===============================
  // LESSON TOGGLE
  // ===============================
  const toggleLesson = (lessonKey) => {
    setRestrictedLessons((prev) =>
      prev.includes(lessonKey)
        ? prev.filter((l) => l !== lessonKey)
        : [...prev, lessonKey]
    );
  };

  // ===============================
  // SAVE RESTRICTIONS
  // ===============================
  const saveRestrictions = async () => {
    if (!isGlobal && !selectedUser) {
      alert("Please select a student or enable Global restriction.");
      return;
    }

    const payload = {
      restricted_lessons: restrictedLessons,
      ...(isGlobal ? {} : { user_id: selectedUser }),
    };

    const res = await apiFetch(`${API_URL}/api/admin/update-lesson-restrictions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setMessage(data.message || "Lesson access updated successfully");
  };

  if (loading || !stats) {
    return (
      <div className="text-center mt-20 text-xl">
        Loading Admin Dashboard...
      </div>
    );
  }

  const chartData = [
    { name: "Students", value: stats.children },
    { name: "Teachers", value: stats.teachers },
   
  ];

  return (
    <>
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Logged in as{" "}
                <strong>
                  {adminFirstName} {adminLastName}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 shadow rounded-xl text-center">
            <h3>Total Users</h3>
            <p className="text-4xl font-bold">{stats.total_users}</p>
          </div>
          <div className="bg-white p-6 shadow rounded-xl text-center">
            <h3>Students</h3>
            <p className="text-4xl font-bold text-green-600">
              {stats.children}
            </p>
          </div>
          <div className="bg-white p-6 shadow rounded-xl text-center">
            <h3>Teachers</h3>
            <p className="text-4xl font-bold text-orange-500">
              {stats.teachers}
            </p>
          </div>
          <div className="bg-white p-6 shadow rounded-xl text-center">
            <h3>Parents</h3>
            <p className="text-4xl font-bold text-pink-500">
              {stats.parents ?? 0}
            </p>
          </div>
         
        </div>

        {/* CHARTS */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} dataKey="value" outerRadius={120} label>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* USER MANAGEMENT */}
        <div className="bg-white p-6 rounded-xl shadow mb-12">
          <h2 className="text-xl font-semibold mb-4">👥 User Management</h2>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b">
                  <td className="p-3">
                    {u.name}
                    {u.linked && <p className="text-xs text-gray-500">{u.linked}</p>}
                  </td>
                  <td className="p-3 capitalize">{u.role === "child" ? "Student" : u.role}</td>
                  <td className="p-3">
                    {u.restricted ? "Restricted" : "Active"}
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => toggleRestrict(u._id)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      {u.restricted ? "Unrestrict" : "Restrict"}
                    </button>
                    <button
                      onClick={() => deleteUser(u._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LESSON ACCESS CONTROL */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">🔒 Lesson Access Control</h2>

          <select
            disabled={isGlobal}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="">-- Select Student --</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.child_name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 mb-4 text-red-600 font-semibold">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={() => {
                setIsGlobal(!isGlobal);
                setSelectedUser("");
              }}
            />
            Apply to ALL children (Global)
          </label>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {LESSONS.map((lesson) => (
              <label
                key={lesson.key}
                className="flex items-center gap-2 bg-gray-100 p-3 rounded"
              >
                <input
                  type="checkbox"
                  checked={restrictedLessons.includes(lesson.key)}
                  onChange={() => toggleLesson(lesson.key)}
                />
                {lesson.label}
              </label>
            ))}
          </div>

          <button
            onClick={saveRestrictions}
            className="bg-black text-white px-6 py-2 rounded-xl flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Restrictions
          </button>

          {message && (
            <p className="mt-3 text-green-600 font-semibold">{message}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
