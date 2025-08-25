import React from "react";

export default function Dashboard() {
  return (
    <div style={{
      maxWidth: 400,
      margin: "40px auto",
      padding: 24,
      border: "1px solid #eee",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    }}>
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard!</p>
      <ul>
        <li>Status: <span style={{color: "green"}}>Online</span></li>
        <li>Notifications: 0</li>
        <li>Profile: <a href="/profile">View</a></li>
      </ul>
    </div>
  );
}