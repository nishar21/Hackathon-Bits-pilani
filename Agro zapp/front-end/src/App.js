import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Intermediate from './Intermediate';
import Items from './Items';
import UserList from './UserList';
import Payment from './Payment';
import Home from './Home';
import About from './About';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}></Route>
          <Route path='/items' element={<Items/>}></Route>
          <Route path='/rent' element={<UserList/>}></Route>
          <Route path='/payment' element={<Payment/>}></Route>
          <Route path='/about' element={<About/>}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
