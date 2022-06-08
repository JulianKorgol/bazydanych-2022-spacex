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
  res.render('index', {
    user: req.session?.userLogin,
    userLogin: req.session?.userLogin
  })
}

function logout(req, res) {
  req.session.destroy();

  homePage(req, res);
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
    userLogin: req.session?.userLogin
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
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('ID', sql.Int, req.query.id)
        .query('SELECT * FROM misja WHERE id = @ID')
    mission = result.recordset

    mission[0].terminRozpoczecia = dataFix(mission[0].terminRozpoczecia)
    mission[0].terminZakonczenia = dataFix(mission[0].terminZakonczenia)

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
    userLogin: req.session?.userLogin
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
  if (req.session.isSuperAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('misjaCreate', {
    privileged: privileged,
    userLogin: req.session?.userLogin
  })
}
// Tworzenie użytkowników
async function createUser(req, res) {
  let user = []

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
  }

  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
  }
  else {
    privileged = false
  }

  res.redirect('uzytkownicy');
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

  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
  }
  else {
    privileged = false
  }

  res.redirect('misje')
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
  if(req.session.isSuperAdmin || req.session.isAdmin)  {
    privileged = true
  }
  else {
    privileged = false
  }
  res.render('panel', {
    userLogin: req.session?.userLogin, 
    privileged: privileged
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

  res.redirect('misje' + '?id=' + req.body.mission)
}

async function userDetails(req, res) {
  let user = []
  console.log(req.query)
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.query.id)
        .query('SELECT * FROM Uzytkownik WHERE Uzytkownik.id = @Id')
    user = result.recordset

    result = await dbRequest
        .input('Idi', sql.Int, req.query.id)
        .query('SELECT Misja.id AS id, nazwa as nazwa, opis as opis, status as status, terminRozpoczecia as terminRozpoczecia, terminZakonczenia as terminZakonczenia FROM Misja JOIN Zaloga Z on Misja.id = Z.idMisja WHERE idUzytkownik = @Idi')
    mission = result.recordset
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
    userLogin: req.session?.userLogin
  })
}

async function StworzMisjeZWzorcemFormularz(req, res) {
  let wzorzec = []
  try {
    const dbRequest = await request()

    result = await dbRequest
        .input('Id', sql.Int, req.query.listaWzorcow)
        .query('SELECT * FROM WzorceMisji WHERE id = @Id')
    wzorzec = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać wzorca misji.', err)
  }

  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }

  res.render('StworzMisjeZWzorcem', {
    wzorzec: wzorzec,
    message: res.message,
    userLogin: req.session?.userLogin,
    isSuperAdmin: req.session?.isSuperAdmin,
    isAdmin: req.session?.isAdmin,
    privileged: privileged
  })
}

async function StworzMisjeZWzorcem(req, res) {
  let wzorzec = []

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
  }

  if (req.session.isSuperAdmin || req.session.isAdmin) {
    privileged = true
  }
  else {
    privileged = false
  }

  res.redirect('misje')
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

//Convert date
function editMissionDataFix(date) {
  new date.toISOString().replace(/T/, ' ').replace(/\..+/, '')

  console.log(date)

  return date
}


async function editMissionShowForm(req, res) {
  let mission = []
  let error = null
  let terminRozpoczecia = null
  let terminZakonczenia = null
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.query.id)
        .query('SELECT * FROM Misja WHERE Misja.id = @Id')
    const status = result.recordset[0].status
    const terminRozpoczecia = editMissionDataFix(result.recordset[0].terminRozpoczecia)
    const terminZakonczenia = editMissionDataFix(result.recordset[0].terminZakonczenia)

    console.log(terminRozpoczecia)

    if (status === "planowana") {
      mission = result.recordset
    } else {
      error = "Nie można edytować misji w tym stanie."
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
    terminRozpoczecia: terminRozpoczecia,
    terminZakonczenia: terminZakonczenia,
    mission: mission,
    userLogin: req.session?.userLogin,
    isSuperAdmin: req.session?.isSuperAdmin,
    isAdmin: req.session?.isAdmin,
    privileged: privileged,
  })
}

async function deleteUser(req, res) {
  try {
    const dbRequest = await request()
    result = await dbRequest
        .input('Id', sql.Int, req.query.id)
        .query('DELETE FROM Uzytkownik WHERE id = @Id')
  } catch (err) {
    console.error('Nie udało się usunąć użytkownika.', err)
    res.redirect('/users')
  }
  res.redirect('/users',
    { message: 'Użytkownik został usunięty.' ,
      userLogin: req.session?.userLogin,
      isSuperAdmin: req.session?.isSuperAdmin,
      isAdmin: req.session?.isAdmin
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
