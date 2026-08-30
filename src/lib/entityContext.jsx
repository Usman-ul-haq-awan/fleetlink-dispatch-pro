import React, { createContext, useContext } from "react";

const EntityContext = createContext({ entityType: "", isVisitor: false });

export const EntityProvider = ({ entityType, children }) => (
  <EntityContext.Provider
    value={{ entityType: entityType || "", isVisitor: (entityType || "") === "visitor" }}
  >
    {children}
  </EntityContext.Provider>
);

export const useEntity = () => useContext(EntityContext);