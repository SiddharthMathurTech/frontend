
import EmployeeList from "../components/EmployeeList"


const handleViewDetails = (user) => {
    console.log("Viewing:", user);
  };

  const handleGenerateReport = (user) => {
    console.log("Report for:", user);
  };

const DashboardPage = () => {
    return (
        <>
            {/* <div className="p-4">
                <UserCard
                    user={{
                        name: "Akash Deep",
                        id: "GI0004",
                        presentDays: 18,
                        absentDays: 6,
                        totalDays: 365
                    }}
                    onViewDetails={handleViewDetails}
                    onGenerateReport={handleGenerateReport}
                />
            </div> */}

            
            <EmployeeList/>


        </>
    )
}

export default DashboardPage;