const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `              <DashboardScreen
                selectedDashboardEdital={selectedDashboardEdital}
                groupedReports={groupedReports}
                appSettings={appSettings}
                setSelectedReport={setSelectedReport}
                handleSetStage={handleSetStage}
                setReportToDelete={setReportToDelete}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                onLoadMore={() => setReportLimit(prev => prev + 50)}`;

const replacement = `              <DashboardScreen
                selectedDashboardEdital={selectedDashboardEdital}
                groupedReports={groupedReports}
                appSettings={appSettings}
                setSelectedReport={setSelectedReport}
                handleSetStage={handleSetStage}
                setReportToDelete={setReportToDelete}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                onLoadMore={() => setReportLimit(prev => prev + 50)}
                onUpdateReport={handleUpdateReport}
                userRole={user?.role}`;

if (code.includes('onLoadMore={() => setReportLimit(prev => prev + 50)}')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx successfully");
} else {
    console.log("Could not find target in App.tsx");
}
