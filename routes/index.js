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
      if (['julia', 'MatGon'].includes(req.session.userLogin)) {
        req.session.isSuperAdmin = true;
      } else if (['MatGon'].includes(req.session.userLogin)) {
        req.session.isAdmin = true;
      }
      homePage(req, res);
    } else {
      res.render('login', {title: 'Logownie', error: 'Logowanie nieudane'});
    }
  } catch (err) {
    res.render('login', {title: 'Logownie', error: 'Logowanie nieudane'});
  }

}

async function homePage(req, res) {
  res.render('index')
}

function logout(req, res) {
  req.session.destroy();

  homePage(req, res);
}

// SPACEX - funkcjonalności
// Wyświetlanie załogi
// Wyświetlanie listy misji
// Tworzenie użytkowników
// Tworzenie załogi - TODO - Formularz i nieprzetestowana funkcja stworzone
// Tworzenie misji - TODO
// Logowanie
// Uprawnienia - TODO - Funkcja isAdmin oraz isSuperAdmin stworzone, jednak problem z porównaniem w HBS
// Korzystanie z wzorców misji - TODO


// Wyświetlanie załogi
async function showCrew(req, res) {
  let crew = []

  try {
    const dbRequest = await request()

    result = await dbRequest
        .query("SELECT * FROM Uzytkownik WHERE rodzajUzytkownika != 'headadmin' or rodzajUzytkownika != 'admin'")

    crew = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać listy załogi', err)
  }

  res.render('zaloga', {
    title: 'Lista załogentów',
    crew: crew,
    message: res.message,
    userLogin: req.session?.userLogin
  })
}

// Wyświetlanie listy misji
async function showMissions(req, res) {
  let missions = []

  try {
    const dbRequest = await request()

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

// Tworzenie załogi
async function createUser(req, res) {
  let user = []

  try {
    const dbRequest = await request()
    result = await dbRequest
        // VarChar - sprawdzenie limitów w bazie danych - TODO
        .input('Imie', sql.VarChar(50), req.body.imie)
        .input('Nazwisko', sql.VarChar(50), req.body.nazwisko)
        .input('Ulica', sql.VarChar(50), req.body.ulica)
        .input('NumerDomu', sql.VarChar(50), req.body.numerDomu)
        .input('NumerMieszkania', sql.VarChar(50), req.body.numerMieszkania)
        .input('Miasto', sql.VarChar(50), req.body.miasto)
        .input('KodPocztowy', sql.VarChar(50), req.body.kodPocztowy)
        .input('RodzajUzytkownika', sql.VarChar(50), req.body.rodzajUzytkownika)
        .input('Specjalizacja', sql.VarChar(50), req.body.specjalizacja)
        .input('SzefId', sql.Int, parseInt(req.body.SzefId))
        .input('Haslo', sql.VarChar(50), req.body.haslo)
        .input('Login', sql.VarChar(50), req.body.login)
        .query('INSERT INTO Uzytkownik (imie, nazwisko, ulica, numerDomu, numerMieszkania, miasto, kodPocztowy, rodzajUzytkownika, specjalizacja, SzefId, haslo, login) VALUES ' +
            '(@Imie, @Nazwisko, @Ulica, @NumerDomu, @NumerMieszkania, @Miasto, @KodPocztowy, @RodzajUzytkownika, @Specjalizacja, @SzefId, @Haslo, @Login)')
  } catch (err) {
    console.error('Nie udało się dodać użytkownika.', err)
  }
}

async function showFormCreateUser(req, res) {
  res.render('zalogaCreate')
}


router.get('/', homePage);
router.get('/login', showLoginForm);
router.post('/login', login);
router.post('/logout', logout);
router.get('/zaloga', showCrew);
router.get('/zalogaCreate', showFormCreateUser);
router.post('/zalogaCreate', createUser);

module.exports = router;
