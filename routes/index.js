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
// Tworzenie załogi
// Tworzenie misji
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
    message: res.message,
    userLogin: req.session?.userLogin
  })
}

// Wyświetlanie listy użytkowników
async function showUsers(req, res) {
  let missions = []

  try {
    const dbRequest = await request()

    result = await dbRequest
        .query('SELECT imie, nazwisko, login FROM Uzytkownik')

    missions = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać listy użytkowników.', err)
  }

  res.render('index', {
    title: 'Lista użytkowników',
    message: res.message,
    userLogin: req.session?.userLogin
  })
}

// Wyświetlanie listy wzorców misji
async function showExamples(req, res) {
  let examples = []

  try {
    const dbRequest = await request()

    result = await dbRequest
        .query('SELECT * FROM ')

    missions = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać listy użytkowników.', err)
  }

  res.render('index', {
    title: 'Lista Wzorców Misji',
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
        // Zwrot jakiejkolwiek informacji do użytkownika - TODO
        // https://github.com/tediousjs/node-mssql#data-types
        .input('Imie', sql.VarChar(30), req.body.imie)
        .input('Nazwisko', sql.VarChar(30), req.body.nazwisko)
        .input('Ulica', sql.VarChar(50), req.body.ulica)
        .input('NumerDomu', sql.SmallInt, parseInt(req.body.numerDomu))
        .input('NumerMieszkania', sql.SmallInt, parseInt(req.body.numerMieszkania))
        .input('Miasto', sql.VarChar(50), req.body.miasto)
        .input('KodPocztowy', sql.Char(6), req.body.kodPocztowy)
        .input('RodzajUzytkownika', sql.VarChar(30), req.body.rodzajUzytkownika)
        .input('Specjalizacja', sql.VarChar(70), req.body.specjalizacja)
        .input('SzefId', sql.Int, parseInt(req.body.SzefId))
        .input('Haslo', sql.VarChar(75), req.body.haslo)
        .input('Login', sql.VarChar(75), req.body.login)
        .query('INSERT INTO Uzytkownik (imie, nazwisko, ulica, numerDomu, numerMieszkania, miasto, kodPocztowy, rodzajUzytkownika, specjalizacja, SzefId, haslo, login) VALUES ' +
            '(@Imie, @Nazwisko, @Ulica, @NumerDomu, @NumerMieszkania, @Miasto, @KodPocztowy, @RodzajUzytkownika, @Specjalizacja, @SzefId, @Haslo, @Login)')
  } catch (err) {
    console.error('Nie udało się dodać użytkownika.', err)
  }
  res.render('zalogaCreate', {error: 'Dodano użytkownika.'})
}

// Tworzenie misji
async function createMission(req, res) {
  let mission = []

  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Nazwa', sql.VarChar(150), req.body.misjaNazwa)
        .input('Opis', sql.VarChar(max), req.body.misjaOpis)
        .input('Status', sql.VarChar(30), req.body.misjaStatus)
        .input('terminRozpoczecia', sql.DateTime, req.body.misjaTerminRozpoczecia)
        .input('terminZakonczenia', sql.DateTime, req.body.misjaTerminZakonczenia)
        .input('WzorzecId', sql.VarChar(50), parseInt(req.body.misjaWzorzecId))
        .query('INSERT INTO Misja (imie, nazwisko, ulica, numerDomu, numerMieszkania, miasto, kodPocztowy, rodzajUzytkownika, specjalizacja, SzefId, haslo, login) VALUES ' +
            '(@Nazwa, @Opis, @Status, @terminRozpoczecia, @terminZakonczenia, @WzorzecId)')
  } catch (err) {
    console.error('Nie udało się dodać użytkownika.', err)
  }
  res.render('zalogaCreate', {error: 'Dodano użytkownika.'})
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
