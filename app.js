const express = require("express");
const app = express();

app.get("/", (req, res)=> {
    res.send("Server is running, Using Gitlab cicd-demo ready.")
})

app.listen(8001, ()=>{
    console.log("Server is running on PORT: 8001");
})