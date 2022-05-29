const express = require('express')
const req = require('express/lib/request')
const async = require('hbs/lib/async')
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
      panel(req, res);
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

  res.render('user', {
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
    missions.forEach(mission => {
      mission.terminZakonczenia = String(mission.terminZakonczenia)
      mission.terminRozpoczecia = String(mission.terminRozpoczecia)
      dataZakonczen = ""
      dataPoczatek = ""
      for (let i = 0; i < mission.terminZakonczenia.length; i++) {
        if (mission.terminZakonczenia[i] === "(") {
          break;
        }
        else {
          dataZakonczen += mission.terminZakonczenia[i]
          dataPoczatek += mission.terminRozpoczecia[i]
        }
      }
      mission.terminZakonczenia = dataZakonczen;
      mission.terminRozpoczecia = dataPoczatek;
    })
  } catch (err) {
    console.error('Nie udało się pobrać listy misji.', err)
  }
  res.render('misja', {
    missions: missions,
    message: res.message,
    userLogin: req.session?.userLogin
  })
}

//Wyświetlanie szczegółów misji
async function showDetailsOfMission(req, res) {
  let zalogent = []
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('ID', sql.Int, req.query.id)
        .query('SELECT * FROM misja WHERE id = @ID')
    mission = result.recordset

    result = await dbRequest
        .input('Idi', sql.Int, req.query.id)
        .query('SELECT * FROM Uzytkownik JOIN Zaloga Z on Uzytkownik.id = Z.idUzytkownik WHERE Z.idMisja = @Idi')
    zalogent = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać szczegółów misji.', err)
  }
  console.log(zalogent)
  res.render('misjaSzczegoly', {
    zalogent: zalogent,
    mission: mission,
    message: res.message,
    userLogin: req.session?.userLogin,
    isSuperAdmin: req.session?.isSuperAdmin,
    isAdmin: req.session?.isAdmin
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

async function showMisjaCreateForm(req, res) {
  res.render('misjaCreate', {userLogin: req.session?.userLogin})
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
  res.render('userCreate', {error: 'Dodano użytkownika.'})
}

// Tworzenie misji
async function createMission(req, res) {
  let mission = []

  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Nazwa', sql.VarChar(150), req.body.nazwa)
        .input('Opis', sql.VarChar(10000), req.body.opis)
        .input('terminRozpoczecia', sql.DateTime, req.body.terminRozpoczecia)
        .input('terminZakonczenia', sql.DateTime, req.body.terminZakonczenia)
        .input('Status', sql.VarChar(200), "planowana")
        .query('INSERT INTO Misja (nazwa, opis, terminRozpoczecia, terminZakonczenia, status) VALUES ' +
            '(@Nazwa, @Opis, @terminRozpoczecia, @terminZakonczenia, @Status)')
  } catch (err) {
    console.error('Nie udało się dodać misji.', err)
  }
  res.render('panel', {error: 'Dodano misje.'})
}

async function showFormCreateUser(req, res) {
  res.render('userCreate', {userLogin: req.session?.userLogin})
}

async function panel(req, res) {
  res.render('panel', {userLogin: req.session?.userLogin})
}

//Logowanie
router.get('/login', showLoginForm);
router.post('/login', login);
//Wylogowywanie
router.post('/logout', logout);
//Wyświetlanie użytkowników
router.get('/uzytkownicy', showCrew);
//Tworzenie użytkowników
router.get('/utworzUzytkownika', showFormCreateUser);
router.post('/utworzUzytkownika', createUser);
//Tworzenie misji
router.get('/StworzMisje', showMisjaCreateForm);
router.post('/StworzMisje', createMission);
//Wyświetlanie misji
router.get('/misje', showMissions)
//Wyświetlanie szczegółów misji
router.get('/misjaSzczegoly', showDetailsOfMission)
//Strona główna
router.get('/', homePage)
//Panel
router.get('/panel', panel)
module.exports = router;
