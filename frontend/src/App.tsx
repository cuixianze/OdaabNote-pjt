import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Users } from './pages/Users';
import { ProblemsByUnit } from './pages/ProblemsByUnit';
import { CreateProblem } from './pages/CreateProblem';
import { CreateProblemSteps } from './pages/CreateProblemSteps';
import { EditProblem } from './pages/EditProblem';
import { RandomExam } from './pages/RandomExam';
import { ExamDetail } from './pages/ExamDetail';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="users" element={<Users />} />
          <Route path="problems" element={<ProblemsByUnit />} />
          <Route path="problems/new" element={<CreateProblemSteps />} />
          <Route path="problems/new/manual" element={<CreateProblem />} />
          <Route path="problems/:problemId/edit" element={<EditProblem />} />
          <Route path="exams/random" element={<RandomExam />} />
          <Route path="exams/:examId" element={<ExamDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
