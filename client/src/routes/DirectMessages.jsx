import React from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";

const DirectMessages = () => {
    const { id } = useParams();
    const [ socket, setSocket ] = useState(null);
    
};

export default DirectMessages;