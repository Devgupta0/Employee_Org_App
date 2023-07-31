import React, { useState } from 'react';
import './App.css';

// Define the Employee interface here
interface Employee {
  uniqueId: number;
  name: string;
  subordinates: Employee[];
}

interface IEmployeeOrgApp {
  ceo: Employee;
  move(employeeID: number, supervisorID: number): void;
  undo(): void;
  redo(): void;
}

class EmployeeOrgApp implements IEmployeeOrgApp {
  private history: {
    employeeID: number;
    oldSupervisorID: number;
    newSupervisorID: number;
  }[] = [];
  private redoHistory: {
    employeeID: number;
    oldSupervisorID: number;
    newSupervisorID: number;
  }[] = [];

  constructor(public ceo: Employee) {}

  move(employeeID: number, supervisorID: number): void {
    const { employee, oldSupervisor } = this.findEmployeeAndOldSupervisor(
      this.ceo,
      employeeID
    );

    if (!employee || !oldSupervisor) {
      throw new Error("Employee not found or invalid supervisor ID.");
    }

    if (employeeID === supervisorID) {
      throw new Error("Cannot move an employee to be their own supervisor.");
    }

    const newSupervisor = this.findEmployee(this.ceo, supervisorID);

    if (!newSupervisor) {
      throw new Error("New supervisor not found.");
    }

    // Keep track of the current state for undo and redo actions
    this.history.push({
      employeeID,
      oldSupervisorID: oldSupervisor.uniqueId,
      newSupervisorID: supervisorID,
    });

    // Remove the employee from the old supervisor's subordinates list
    oldSupervisor.subordinates = oldSupervisor.subordinates.filter(
      (subordinate) => subordinate.uniqueId !== employeeID
    );

    // Add the employee to the new supervisor's subordinates list
    newSupervisor.subordinates.push(employee);
  }

  undo(): void {
    const lastMove = this.history.pop();

    if (!lastMove) {
      return;
    }

    const { employeeID, oldSupervisorID, newSupervisorID } = lastMove;

    const { employee, oldSupervisor } = this.findEmployeeAndOldSupervisor(
      this.ceo,
      employeeID
    );

    if (!employee || !oldSupervisor) {
      throw new Error("Employee not found.");
    }

    const newSupervisor = this.findEmployee(this.ceo, newSupervisorID);

    if (!newSupervisor) {
      throw new Error("New supervisor not found.");
    }

    // Keep track of the current state for redo action
    this.redoHistory.push({
      employeeID,
      oldSupervisorID: newSupervisorID,
      newSupervisorID: oldSupervisorID,
    });

    // Remove the employee from the new supervisor's subordinates list
    newSupervisor.subordinates = newSupervisor.subordinates.filter(
      (subordinate) => subordinate.uniqueId !== employeeID
    );

    // Add the employee back to the old supervisor's subordinates list
    oldSupervisor.subordinates.push(employee);
  }

  redo(): void {
    const lastUndo = this.redoHistory.pop();

    if (!lastUndo) {
      return;
    }

    const { employeeID, oldSupervisorID, newSupervisorID } = lastUndo;

    const { employee, oldSupervisor } = this.findEmployeeAndOldSupervisor(
      this.ceo,
      employeeID
    );

    if (!employee || !oldSupervisor) {
      throw new Error("Employee not found.");
    }

    const newSupervisor = this.findEmployee(this.ceo, newSupervisorID);

    if (!newSupervisor) {
      throw new Error("New supervisor not found.");
    }

    // Keep track of the current state for undo action
    this.history.push({
      employeeID,
      oldSupervisorID: newSupervisorID,
      newSupervisorID: oldSupervisorID,
    });

    // Remove the employee from the old supervisor's subordinates list
    oldSupervisor.subordinates = oldSupervisor.subordinates.filter(
      (subordinate) => subordinate.uniqueId !== employeeID
    );

    // Add the employee back to the new supervisor's subordinates list
    newSupervisor.subordinates.push(employee);
  }

  private findEmployee(root: Employee, employeeID: number): Employee | undefined {
    if (root.uniqueId === employeeID) {
      return root;
    }

    for (const subordinate of root.subordinates) {
      const result = this.findEmployee(subordinate, employeeID);
      if (result) {
        return result;
      }
    }

    return undefined;
  }

  private findEmployeeAndOldSupervisor(
    root: Employee,
    employeeID: number
  ): { employee: Employee | undefined; oldSupervisor: Employee | undefined } {
    if (root.subordinates.some((subordinate) => subordinate.uniqueId === employeeID)) {
      return { employee: root.subordinates.find((subordinate) => subordinate.uniqueId === employeeID), oldSupervisor: root };
    }

    for (const subordinate of root.subordinates) {
      const result = this.findEmployeeAndOldSupervisor(subordinate, employeeID);
      if (result.employee && result.oldSupervisor) {
        return result;
      }
    }

    return { employee: undefined, oldSupervisor: undefined };
  }
}

// Sample data for the organization chart
const ceo: Employee = {
  uniqueId: 1,
  name: 'John Smith',
  subordinates: [
    // Margot's subordinates
    {
      uniqueId: 2,
      name: 'Margot Donald',
      subordinates: [
        {
          uniqueId: 6,
          name: 'Tina Teff',
          subordinates: [],
        },
        // ... (Other subordinates of Margot) ...
      ],
    },
    // Tyler's subordinates
    {
      uniqueId: 3,
      name: 'Tyler Simpson',
      subordinates: [
        {
          uniqueId: 7,
          name: 'Ben Willis',
          subordinates: [],
        },
        // ... (Other subordinates of Tyler) ...
      ],
    },
    // ... (Other subordinates of CEO) ...
  ],
};

function App(): JSX.Element {
  // State variables to store input values and the organization chart app instance
  const [employeeID, setEmployeeID] = useState<string>('');
  const [supervisorID, setSupervisorID] = useState<string>('');
  const [orgApp, setOrgApp] = useState<EmployeeOrgApp>(() => new EmployeeOrgApp(ceo));
  const [orgHierarchy, setOrgHierarchy] = useState<Employee[]>([ceo]);

  // Function to update the organization chart and display it on the page
  const updateOrgChart = (): void => {
    // Update the organization chart hierarchy based on the current state of orgApp
    setOrgHierarchy([orgApp.ceo]);
  };

  // Function to move an employee to a new supervisor
  const moveEmployee = (): void => {
    try {
      // Convert employeeID and supervisorID to numbers (assuming you have input validation in the UI)
      const empID = Number(employeeID);
      const supID = Number(supervisorID);
      orgApp.move(empID, supID);
      updateOrgChart(); // Update the organization chart after the move
      setEmployeeID('');
      setSupervisorID('');
    } catch (error) {
     
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred.');
      }
    }
  };

  // Function to undo the last move action
  const undoLastMove = (): void => {
    try {
      orgApp.undo();
      updateOrgChart(); // Update the organization chart after the undo
    }  catch (error) {
     
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred.');
      }
    }
  };

  // Function to redo the last undone action
  const redoLastUndo = (): void => {
    try {
      orgApp.redo();
      updateOrgChart(); // Update the organization chart after the redo
    }  catch (error) {
     
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred.');
      }
    }
  };

  // Function to render the employee and its subordinates recursively
  const renderEmployeeHierarchy = (employee: Employee): JSX.Element => (
    <div key={employee.uniqueId}>
      <p>
        {employee.name} - {employee.uniqueId}
      </p>
      {employee.subordinates.length > 0 && (
        <ul style={{ marginLeft: '20px' }}>
          {employee.subordinates.map((subordinate) => (
            <li key={subordinate.uniqueId}>
              {renderEmployeeHierarchy(subordinate)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
  
  

  return (
    <div className="App">
      <div className="container">
        <h1>Employee Organization Chart</h1>
        <div className="org-chart" id="org-chart">
          {orgHierarchy.map(renderEmployeeHierarchy)}
        </div>
        <div className="actions">
          <label htmlFor="employee-id">Employee ID:</label>
          <input
            type="number"
            id="employee-id"
            value={employeeID}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmployeeID(e.target.value)
            }
          />
          <label htmlFor="supervisor-id">Supervisor ID:</label>
          <input
            type="number"
            id="supervisor-id"
            value={supervisorID}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSupervisorID(e.target.value)
            }
          />
          <button onClick={moveEmployee}>Move</button>
          <button onClick={undoLastMove}>Undo</button>
          <button onClick={redoLastUndo}>Redo</button>
        </div>
      </div>
    </div>
  );
}

export default App;
