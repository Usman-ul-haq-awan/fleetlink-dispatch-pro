import React from "react";
import Layout from "@/components/Layout";
import SecurityGate from "@/components/SecurityGate";

// Wraps the app Layout with the SecurityGate so that every protected route
// requires admin approval, a complete profile (phone + ID), and a valid
// 4-digit login code before the sidebar/app is rendered.
export default function ProtectedLayout() {
  return (
    <SecurityGate>
      <Layout />
    </SecurityGate>
  );
}