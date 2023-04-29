package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type Franchise struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Location   string            `json:"location"`
	Employees  []Employee        `json:"employees"`
	Openings   []Shift           `json:"openings"`
	Filled     []Shift           `json:"filled"`
	ShiftIndex map[string]*Shift `json:"shiftIndex"`
}

type Employee struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Franchise string `json:"franchise"`
}

type Shift struct {
	ID          string   `json:"id"`
	FranchiseID string   `json:"franchiseId"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	StartTime   int64    `json:"startTime"`
	EndTime     int64    `json:"endTime"`
	Applicants  []string `json:"applicants"`
	Approved    []string `json:"approved"`
}

type SmartContract struct {
	contractapi.Contract
}

// AddFranchise adds a new franchise to the network
func (s *SmartContract) AddFranchise(ctx contractapi.TransactionContextInterface, id string, name string, location string) error {
	franchise := Franchise{
		ID:         id,
		Name:       name,
		Location:   location,
		Employees:  []Employee{},
		Openings:   []Shift{},
		Filled:     []Shift{},
		ShiftIndex: make(map[string]*Shift),
	}
	franchiseJSON, err := json.Marshal(franchise)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, franchiseJSON)
}

// GetFranchise returns the franchise with the given ID
func (s *SmartContract) GetFranchise(ctx contractapi.TransactionContextInterface, id string) (*Franchise, error) {
	franchiseJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if franchiseJSON == nil {
		return nil, fmt.Errorf("franchise with ID %s does not exist", id)
	}
	var franchise Franchise
	err = json.Unmarshal(franchiseJSON, &franchise)
	if err != nil {
		return nil, err
	}
	return &franchise, nil
}

// AddEmployee adds a new employee to a franchise
func (s *SmartContract) AddEmployee(ctx contractapi.TransactionContextInterface, id string, name string, franchiseID string) error {
	franchise, err := s.GetFranchise(ctx, franchiseID)
	if err != nil {
		return err
	}
	employee := Employee{
		ID:        id,
		Name:      name,
		Franchise: franchiseID,
	}
	franchise.Employees = append(franchise.Employees, employee)
	franchiseJSON, err := json.Marshal(franchise)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(franchiseID, franchiseJSON)
}

// GetEmployees returns the list of employees for the given franchise
func (s *SmartContract) GetEmployees(ctx contractapi.TransactionContextInterface, franchiseID string) ([]Employee, error) {
	franchise, err := s.GetFranchise(ctx, franchiseID)
	if err != nil {
		return nil, err
	}
	return franchise.Employees, nil
}

// AddShift adds a new shift opening to a franchise
func (s *SmartContract) AddShift(ctx contractapi.TransactionContextInterface, id string, franchiseID string, title string, description string, startTime int64, endTime int64) error {
	franchise, err := s.GetFranchise(ctx, franchiseID)
	if err != nil {
		return err
	}
	shift := Shift{
		ID:          id,
		FranchiseID: franchiseID,
		Title:       title,
		Description: description,
		StartTime:   startTime,
		EndTime:     endTime,
		Applicants:  []string{},
		Approved:    []string{},
	}
	franchise.Openings = append(franchise.Openings, shift)
	franchise.ShiftIndex[id] = &shift
	franchiseJSON, err := json.Marshal(franchise)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(franchiseID, franchiseJSON)
}

// GetOpenShifts returns the list of shift openings for the given franchise
func (s *SmartContract) GetOpenShifts(ctx contractapi.TransactionContextInterface, franchiseID string) ([]Shift, error) {
	franchise, err := s.GetFranchise(ctx, franchiseID)
	if err != nil {
		return nil, err
	}
	return franchise.Openings, nil
}

// ApplyForShift applies an employee for a shift opening
func (s *SmartContract) ApplyForShift(ctx contractapi.TransactionContextInterface, employeeID string, shiftID string) error {
	shift, err := s.GetShift(ctx, shiftID)
	if err != nil {
		return err
	}
	if shift.FranchiseID == "" {
		return fmt.Errorf("shift with ID %s does not exist", shiftID)
	}
	employee, err := s.GetEmployee(ctx, employeeID)
	if err != nil {
		return err
	}
	if employee.Franchise != shift.FranchiseID {
		return fmt.Errorf("employee with ID %s does not belong to the franchise with ID %s", employeeID, shift.FranchiseID)
	}
	shift.Applicants = append(shift.Applicants, employeeID)
	franchise, err := s.GetFranchise(ctx, shift.FranchiseID)
	if err != nil {
		return err
	}
	franchiseJSON, err := json.Marshal(franchise)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(shift.FranchiseID, franchiseJSON)
}

// ApproveShiftApplication approves an employee for a shift opening
func (s *SmartContract) ApproveShiftApplication(ctx contractapi.TransactionContextInterface, employeeID string, shiftID string) error {
	shift, err := s.GetShift(ctx, shiftID)
	if err != nil {
		return err
	}
	if shift.FranchiseID == "" {
		return fmt.Errorf("shift with ID %s does not exist", shiftID)
	}
	employee, err := s.GetEmployee(ctx, employeeID)
	if err != nil {
		return err
	}
	if employee.Franchise != shift.FranchiseID {
		return fmt.Errorf("employee with ID %s does not belong to the franchise with ID %s", employeeID, shift.FranchiseID)
	}
	shift.Applicants = removeString(shift.Applicants, employeeID)
	shift.Approved = append(shift.Approved, employeeID)
	franchise, err := s.GetFranchise(ctx, shift.FranchiseID)
	if err != nil {
		return err
	}
	franchiseJSON, err := json.Marshal(franchise)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(shift.FranchiseID, franchiseJSON)
}

// GetFranchises returns the list of all franchises
func (s *SmartContract) GetFranchises(ctx contractapi.TransactionContextInterface) ([]Franchise, error) {
	franchisesIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer franchisesIterator.Close()
	var franchises []Franchise
	for franchisesIterator.HasNext() {
		franchiseResponse, err := franchisesIterator.Next()
		if err != nil {
			return nil, err
		}

		var franchise Franchise
		err = json.Unmarshal(franchiseResponse.Value, &franchise)
		if err != nil {
			return nil, err
		}

		franchises = append(franchises, franchise)
	}

	return franchises, nil
}

// GetShift returns the shift with the given ID
func (s *SmartContract) GetShift(ctx contractapi.TransactionContextInterface, shiftID string) (*Shift, error) {
	franchises, err := s.GetFranchises(ctx)
	if err != nil {
		return nil, err
	}
	for _, franchise := range franchises {
		if shift, ok := franchise.ShiftIndex[shiftID]; ok {
			return shift, nil
		}
	}

	return nil, fmt.Errorf("shift with ID %s does not exist", shiftID)
}

// GetEmployee returns the employee with the given ID
func (s *SmartContract) GetEmployee(ctx contractapi.TransactionContextInterface, employeeID string) (*Employee, error) {
	employeeJSON, err := ctx.GetStub().GetState(employeeID)
	if err != nil {
		return nil, err
	}
	if employeeJSON == nil {
		return nil, fmt.Errorf("employee with ID %s does not exist", employeeID)
	}
	var employee Employee
	err = json.Unmarshal(employeeJSON, &employee)
	if err != nil {
		return nil, err
	}
	return &employee, nil
}

// removeString removes a string from a slice of strings
func removeString(slice []string, s string) []string {
	for i, v := range slice {
		if v == s {
			slice[i] = slice[len(slice)-1]
			return slice[:len(slice)-1]
		}
	}
	return slice
}
