const express = require('express')
const req = require('express/lib/request')
const async = require('hbs/lib/async')
const moment = require('moment')
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
  let homepage = true
  res.render('index', {
    user: req.session?.userLogin,
    userLogin: req.session?.userLogin,
    homePage: homepage,
  })
}

function logout(req, res) {
  req.session.destroy();

  res.redirect('/', code=302)
}

// Wyświetlanie listy użytkowników
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
  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('user', {
    crew: crew,
    message: res.message,
    privileged: privileged,
    userLogin: req.session?.userLogin,
  })
}

function dataFix(data) {
  let dataResult = ""
  data = String(data)
  for (let i = 0; i < data.length; i++) {
    if (data[i] === "(") {
      break;
    }
    else {
      dataResult += data[i]
    }
  }
  return dataResult
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
      mission.terminRozpoczecia = dataFix(mission.terminRozpoczecia)
      mission.terminZakonczenia = dataFix(mission.terminZakonczenia)
    })
  } catch (err) {
    console.error('Nie udało się pobrać listy misji.', err)
  }
  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }  
  else {
    privileged = false
  }
  res.render('misja', {
    missions: missions,
    message: res.message,
    privileged: privileged,
    userLogin: req.session?.userLogin
  })
}

//Wyświetlanie szczegółów misji
async function showDetailsOfMission(req, res) {
  let zalogent = []
  let mission = []
  let error
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('ID', sql.Int, req.query.id)
        .query('SELECT * FROM misja WHERE id = @ID')

    if (result.rowsAffected[0] === 1) {
      mission = result.recordset

      mission[0].terminRozpoczecia = dataFix(mission[0].terminRozpoczecia)
      mission[0].terminZakonczenia = dataFix(mission[0].terminZakonczenia)
    } else {
      error = "Coś poszło nie tak, spróbuj ponownie."
    }

    result = await dbRequest
        .input('Idi', sql.Int, req.query.id)
        .query('SELECT * FROM Uzytkownik JOIN Zaloga Z on Uzytkownik.id = Z.idUzytkownik WHERE Z.idMisja = @Idi')
    zalogent = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać szczegółów misji.', err)
  }

  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('misjaSzczegoly', {
    zalogent: zalogent,
    mission: mission,
    message: res.message,
    privileged: privileged,
    userLogin: req.session?.userLogin,
    error: error
  })
}

// Wyświetlanie listy wzorców misji
async function showExamples(req, res) {
  let examples = []

  try {
    const dbRequest = await request()

    result = await dbRequest
        .query('SELECT * FROM WzorceMisji')

    examples = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać listy wzorców.', err)
  }

  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
  }
  else {
    privileged = false
  }

  res.render('wzorce', {
    wzorce: examples,
    message: res.message,
    userLogin: req.session?.userLogin,
    privileged: privileged
  })
}

async function showMisjaCreateForm(req, res) {
  req.session.date = new Date()
  let month = req.session.date.getMonth() + 1
  if (month < 10) {
    month = '0' + month
  }
  let day = req.session.date.getDate() + 1
  if (day < 10) {
    day = '0' + day
  }
  let date =   req.session.date.getFullYear() + "-" + month + "-" + day
  if (req.session.isSuperAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('misjaCreate', {
    privileged: privileged,
    userLogin: req.session?.userLogin,
    date: date
  })
}
// Tworzenie użytkowników
async function createUser(req, res) {
  let user = []
  message = undefined
  try {
    const dbRequest = await request()
    result = await dbRequest
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
    message = 'Nie udało się dodać użytkownika.'
  }

  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
  }
  else {
    privileged = false
  }
  if (message === undefined) {
    res.redirect('uzytkownicy');
  }
  else {
    res.render('userCreate', {
      error: message,
      userLogin: req.session?.userLogin,
      privileged: privileged
    })
  }
}

// Tworzenie misji
async function createMission(req, res) {
  let mission = []
  message = undefined
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
    message = 'Nie udało się dodać misji.'
  }

  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
  }
  else {
    privileged = false
  }

  if (message === undefined) {
    res.redirect('misje');
  }
  else {
    res.render('misjaCreate', {
      error: message,
      userLogin: req.session?.userLogin,
      privileged: privileged
    })
  }
}

async function showFormCreateUser(req, res) {
  let szefowie = []

  try {
    const dbRequest = await request()
    result = await dbRequest
        .query("SELECT id, imie, nazwisko FROM Uzytkownik WHERE rodzajUzytkownika = 'admin' OR rodzajUzytkownika = 'headadmin'")
    szefowie = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać listy szefów.', err)
  }

  if (req.session.isSuperAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('userCreate', {
    privileged: privileged,
    userLogin: req.session?.userLogin,
    szefowie: szefowie
  })
}

async function panel(req, res) {
  let mission
  let user
  let NotLoggedIn = true

  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
    NotLoggedIn = false
  }
  else if (req.session.userLogin !== undefined) {
    privileged = false
    user = true
    NotLoggedIn = false

    try {
      const dbRequest = await request()
      result = await dbRequest
          .input('Login', sql.VarChar(150), req.session.userLogin)
          .query("SELECT Misja.id id, nazwa, opis, status, terminRozpoczecia, terminZakonczenia FROM Misja FULL OUTER JOIN Zaloga Z on Misja.id = Z.idMisja JOIN Uzytkownik U on U.id = Z.idUzytkownik WHERE login = @Login")
      mission = result.recordset
    } catch (err) {
      console.error('Nie udało się pobrać listy szefów.', err)
    }
  } else {
    privileged = false
  }
  res.render('panel', {
    mission: mission,
    user: user,
    userLogin: req.session?.userLogin, 
    privileged: privileged,
    NotLoggedIn: NotLoggedIn,
  })
}

//Dodawanie załogentów do misji -> get
async function showFormAddCrewToMission(req, res) {
  let zalogenci = []
  let mission = []
  let error = null
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('ID', sql.Int, req.query.id)
        .query('SELECT * FROM misja WHERE id = @ID')
    mission = result.recordset
    const status = result.recordset[0].status

    if (status === "planowana") {
      result = await dbRequest
          .input('Idi', sql.Int, req.query.id)
          .query('SELECT * FROM Uzytkownik where not id in (SELECT U.id from Uzytkownik U join Zaloga Z on U.id = Z.idUzytkownik join Misja M on Z.idMisja = M.id where Z.idMisja = @Idi)')
      zalogenci = result.recordset
    } else {
      error = "Nie można dodać załogentów do misji, która jest w trakcie lub zakończona"
    }
  } catch (err) {
    console.error('Nie udało się pobrać szczegółów misji.', err)
  }
  if (req.session.isAdmin || req.session.isSuperAdmin) {
    privileged = true
  } else {
    privileged = false
  }
  res.render('addCrew', {
    error: error,
    zalogenci: zalogenci,
    mission: mission,
    message: res.message,
    privileged: privileged,
    userLogin: req.session?.userLogin
  })

}

//Dodawanie załogentów do misji -> post
async function addCrewToMission(req, res) {
  let crew = []

  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.body.crew)
        .input('IdMisja', sql.Int, req.body.mission)
        .query('INSERT INTO Zaloga (idUzytkownik, idMisja) VALUES (@Id, @IdMisja)')
  } catch (err) {
    console.error('Nie udało się dodać misji.', err)
  }

  if (req.session.isAdmin || req.session.isSuperAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }

  res.redirect('misjaSzczegoly' + '?id=' + req.body.mission)
}

async function userDetails(req, res) {
  let user = []
  let mission = []
  let error = null

  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.query.id)
        .query('SELECT * FROM Uzytkownik WHERE Uzytkownik.id = @Id')
    if (result.rowsAffected[0] === 1) {
      user = result.recordset
    } else {
      error = "Coś poszło nie tak, spróbuj ponownie."
    }

    result = await dbRequest
        .input('Idi', sql.Int, req.query.id)
        .query('SELECT Misja.id AS id, nazwa as nazwa, opis as opis, status as status, terminRozpoczecia as terminRozpoczecia, terminZakonczenia as terminZakonczenia FROM Misja JOIN Zaloga Z on Misja.id = Z.idMisja WHERE idUzytkownik = @Idi')
    if (result.rowsAffected[0] >= 0) {
      mission = result.recordset
    } else {
      error = "Coś poszło nie tak, spróbuj ponownie."
    }
  } catch (err) {
    console.error('Nie udało się pobrać szczegółów użytkownika.', err)
  }
  mission.forEach(mission => {
    mission.terminRozpoczecia = dataFix(mission.terminRozpoczecia)
    mission.terminZakonczenia = dataFix(mission.terminZakonczenia)
  })
  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('userDetails', {
    user: user,
    mission: mission,
    privileged: privileged,
    userLogin: req.session?.userLogin,
    error: error
  })
}

async function StworzMisjeZWzorcemFormularz(req, res) {
  let wzorzec = []
  let error = null

  try {
    const dbRequest = await request()

    result = await dbRequest
        .input('Id', sql.Int, req.query.listaWzorcow)
        .query('SELECT * FROM WzorceMisji WHERE id = @Id')
    if (result.rowsAffected[0] === 1) {
      wzorzec = result.recordset
    } else {
      error = "Coś poszło nie tak, spróbuj ponownie."
    }
  } catch (err) {
    console.error('Nie udało się pobrać wzorca misji.', err)
  }

  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  req.session.date = new Date()
  let month = req.session.date.getMonth() + 1
  if (month < 10) {
    month = '0' + month
  }
  let day = req.session.date.getDate() + 1
  if (day < 10) {
    day = '0' + day
  }
  let date =   req.session.date.getFullYear() + "-" + month + "-" + day
  res.render('StworzMisjeZWzorcem', {
    wzorzec: wzorzec,
    message: res.message,
    userLogin: req.session?.userLogin,
    privileged: privileged,
    error: error,
    date: date
  })
}

async function StworzMisjeZWzorcem(req, res) {
  let wzorzec = []
  message = undefined
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Nazwa', sql.VarChar(150), req.body.nazwa)
        .input('Opis', sql.VarChar(10000), req.body.opis)
        .input('terminRozpoczecia', sql.DateTime, req.body.terminRozpoczecia)
        .input('terminZakonczenia', sql.DateTime, req.body.terminZakonczenia)
        .input('Status', sql.VarChar(200), "planowana")
        .input('IdWzorca', sql.Int, req.query.listaWzorcow)
        .query('INSERT INTO Misja (nazwa, opis, terminRozpoczecia, terminZakonczenia, status, wzorzecId) VALUES (@Nazwa, @Opis, @terminRozpoczecia, @terminZakonczenia, @Status, @IdWzorca)')
  } catch (err) {
    console.error('Nie udało się dodać misji.', err)
    message = "Nie udało się dodać misji."
  }

  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }

  if (message === undefined) {
    res.redirect('/misje')
  }
  else {
    res.render('StworzMisjeZWzorcem', {
      error: message,
      privileged: privileged,
      userLogin: req.session?.userLogin
    })
  }
}

async function DeleteMemberOfCrew(req, res) {
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.body.idUzytkownik)
        .input('IdMisja', sql.Int, req.body.idMisja)
        .query('DELETE FROM Zaloga WHERE idUzytkownik = @Id AND idMisja = @IdMisja')
  } catch (err) {
    console.error('Nie udało się usunąć użytkownika.', err)
  }
  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  res.redirect('misjaSzczegoly' + '?id=' + req.body.idMisja)
}

async function editMission(req, res) {
  let mission = []
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.query.id)
        .input('Nazwa', sql.VarChar(150), req.body.nazwa)
        .input('Opis', sql.VarChar(10000), req.body.opis)
        .input('Status', sql.VarChar(10), req.body.status)
        .input('terminRozpoczecia', sql.DateTime, req.body.terminRozpoczecia)
        .input('terminZakonczenia', sql.DateTime, req.body.terminZakonczenia)
        .query("UPDATE Misja SET nazwa = @Nazwa, opis = @Opis, status = @Status, terminRozpoczecia = @terminRozpoczecia, terminZakonczenia = @terminZakonczenia WHERE id = @Id")
    
  } catch (err) {
    console.error('Nie udało się pobrać szczegółów misji.', err)
  }
  res.redirect('misjaSzczegoly' + '?id=' + req.query.id)
}

async function editMissionShowForm(req, res) {
  let mission = []
  let error = null
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.query.id)
        .query('SELECT * FROM Misja WHERE Misja.id = @Id')

    if (result.rowsAffected[0] === 1) {
      const status = result.recordset[0].status

      result.recordset[0].terminRozpoczecia = moment(result.recordset[0].terminRozpoczecia).format('YYYY-MM-DD')
      result.recordset[0].terminZakonczenia = moment(result.recordset[0].terminZakonczenia).format('YYYY-MM-DD')

      if (status === "planowana") {
        mission = result.recordset
      } else {
        error = "Nie można edytować misji w tym stanie."
      }
    } else {
      error = "Coś poszło nie tak, spróbuj ponownie."
    }
  } catch (err) {
    console.error('Nie udało się pobrać szczegółów misji.', err)
  }
  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('editMission', {
    error: error,
    mission: mission,
    userLogin: req.session?.userLogin,
    privileged: privileged,
  })
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
//Dodawanie załogentów do misji
router.get('/addCrew', showFormAddCrewToMission)
router.post('/addCrew', addCrewToMission)
//Szczegóły użytkownika
router.get('/userDetails', userDetails)
//Lista wzorców misji
router.get('/wzorce', showExamples)
//Stwórz misje na podstawie wzorca
router.get('/StworzMisjeZWzorcem', StworzMisjeZWzorcemFormularz)
router.post('/StworzMisjeZWzorcem', StworzMisjeZWzorcem)
//Usuwanie użytkowników
router.post('/deleteMember', DeleteMemberOfCrew)
// Edytowaanie misji
router.get('/editMission', editMissionShowForm)
router.post('/editMission', editMission)
module.exports = router;
