const express = require('express')
const req = require('express/lib/request')
const sql = require('mssql')
const router = express.Router()
const { request } = require('../database')

async function login(req, res) {
    const {login, password} = req.body;
  
    try {
      const dbRequest = await request()
  
      const result = await dbRequest
        .input('Login', sql.VarChar(50), login)
        .input('Haslo', sql.VarChar(50), password)
        .query('SELECT Login FROM Uzytkownicy WHERE Login = @Login AND Haslo = @Haslo')
    
      if (result.rowsAffected[0] === 1) {
        req.session.userLogin = login;
        homePage(req, res);
      } else {
        res.render('login', {title: 'Logownie', error: 'Logowanie nieudane'})
      }
    } catch (err) {
      res.render('login', {title: 'Logownie', error: 'Logowanie nieudane'})
    }
  
  }
  
  function logout(req, res) {
    req.session.destroy();
  
    showProducts(req, res);
  }