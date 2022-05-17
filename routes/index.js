const express = require('express')
const req = require('express/lib/request')
const sql = require('mssql')
const router = express.Router()
const { request } = require('../database')

async function showLoginForm(req, res) {
  res.render('login', { title: 'Logowanie' })
}

async function login(req, res) {
  const {login, password} = req.body;

  try {
    const dbRequest = await request()

    const result = await dbRequest
      .input('Login', sql.VarChar(50), login)
      .input('Haslo', sql.VarChar(50), password)
      .query('SELECT login FROM Uzytkownik WHERE login = @Login AND haslo = @Haslo')
  
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

async function homePage(req, res) {
  res.render('index')
}

function logout(req, res) {
  req.session.destroy();

  showProducts(req, res);
}

// SPACEX - funkcjonalności
// Wyświetlanie załogi
// Wyświetlanie listy misji
// Logowanie
// Tworzenie załogi - TODO
// Tworzenie misji - TODO
// Uprawnienia - TODO
// Korzystanie z wzorców misji - TODO


// Wyświetlanie załogi
async function showCrew(req, res) {
  let crew = []

  try {
    const dbRequest = await request()
    let crew;

    result = await dbRequest
        .query("SELECT * FROM Uzytkownik WHERE rodzajUzytkownika != 'headadmin' or rodzajUzytkownika != 'admin'")

    crew = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać listy załogi', err)
  }

  res.render('index', {
    title: 'Lista załogentów',
    crewlist: crew,
    message: res.message,
    userLogin: req.session?.userLogin
  })
}

// Wyświetlanie listy misji
async function showMissions(req, res) {
  let missions = []

  try {
    const dbRequest = await request()
    let missions;

    result = await dbRequest
        .query('SELECT * FROM Misja')

    missions = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać listy misji.', err)
  }

  res.render('index', {
    title: 'Lista misji',
    missions: missions,
    message: res.message,
    userLogin: req.session?.userLogin
  })
}


router.get('/', homePage);
router.get('/login', showLoginForm);
router.post('/login', login);
router.post('/logout', logout);
router.post('/zalogaCreate', logout);
module.exports = router;
