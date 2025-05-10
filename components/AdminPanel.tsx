import React from "react";

interface AdminPanelProps {
  onMigrateData: () => void;
}

export default function AdminPanel({ onMigrateData }: AdminPanelProps) {
  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">🛠 Admin Panel</h3>
      <button
        onClick={() => {
          onMigrateData();
          alert("🔁 Data migration completed. Local storage records updated.");
        }}
        className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded font-semibold transition"
      >
        🔁 Migrate Data
      </button>
    </div>
  );
}
