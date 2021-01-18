const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')

const KET_URL = "https://e-seimas.lrs.lt/rs/actualedition/TAIS.203613/YAaverzEYr/"

request(KET_URL, function (error, response, body) {
  parseData(body)
})

function parseData(body) {
  var $ = cheerio.load(body)
  var sections = $(".WordSection1").children()
  
  var rules = sections[1]
  var signs = sections[2]
  var variableSigns = sections[3]
  var roadMarkings = sections[4]
  var vehicleMarking = sections[5]

  var results = {
    "rules": parseRules(rules),
    "signs": parseSigns(signs),
    "variable_signs": parseVariableSigns(variableSigns),
    "road_markings": parseRoadMarkings(roadMarkings),
    "vehicle_marking": parsevehicleMarkings(vehicleMarking)
  }

  var prettyJSON = JSON.stringify(results, null, 2)
  fs.writeFile("results.json", prettyJSON, function(err) {
    if (err) {
      return console.log(err);
    }
  }) 
}

function forEachSection(body, callback) {
  var $ = cheerio.load(body)
  $(":first-child").children("div[id^='part_']").each(function(index, item) { 
    var sectionTitle = $(this).find("p[class=MsoNormal][align=center]").has(":contains(' ')")
    if (sectionTitle.html() != null) {
      var sectionData = {
        "number": index + 1,
        "name": sectionTitle.eq(0).text() + " " + sectionTitle.eq(1).text(),
        "statement_list": []
      }
      callback(sectionData, this)
    }
  })
}

function parseRules(body) {
  var $ = cheerio.load(body)
  var data = {
    "name": "KELIŲ EISMO TAISYKLĖS",
    "section_list": []
  }
  forEachSection(body, function(section, element) {
    $(element).find("p[style^='text-align:justify;text-indent:.5in;']").each(function(index, item) {
      section['statement_list'].push($(this).text())
    })
    data['section_list'].push(section)
  })
  return data
}

function parseSigns(body) {
  var $ = cheerio.load(body)
  var data = {
    "name": "KELIO ŽENKLAI",
    "section_list": []
  }
  forEachSection(body, function(section, element) {
    $(element).children("div[id^='part_']").each(function(index, section_item) { 
      var text = $(section_item).find("p[style^='text-align:justify;text-indent:.5in;']").first().text()
      var statement = {
        "text": text,
        "sigin_list": []
      }
      $(section_item).find("tbody > tr[style^='page-break-']").each(function(index, table_row_item) {
        var cols = $(table_row_item).find("td")
        var sign = {
          "number": cols.eq(0).text(),
          "name": cols.eq(1).text(),
          "img_src_list": [],
          "summary": cols.eq(3).text()
        }
        cols.eq(2).find("img").each(function(index, img_item) {
          sign['img_src_list'].push(KET_URL + $(img_item).attr("src"))
        })
        statement['sigin_list'].push(sign)
      })
      section['statement_list'].push(statement)
    })
    data['section_list'].push(section)
  })
  return data
}


function parseVariableSigns(body) {
  var $ = cheerio.load(body)
  var data = {
    "name": "KINTAMOS INFORMACIJOS KELIO ŽENKLŲ PAVYZDŽIAI",
    "section_list": []
  }

  var text = $("*").find("p[style^='text-align:justify;text-indent:.5in;']").first().text()
  var statement = {
    "text": text,
    "sigin_list": []
  }
  $("*").find("img").each(function(index, img_item) {
    statement['sigin_list'].push(KET_URL + $(img_item).attr("src"))
  })

  data['section_list'].push(statement)
  return data
}

function parseRoadMarkings(body) {
  var $ = cheerio.load(body)
  var data = {
    "name": "KELIŲ ŽENKLINIMAS IR JO CHARAKTERISTIKOS",
    "section_list": []
  }

  forEachSection(body, function(section, element) {
    $(element).find("p[style^='text-align:justify;text-indent:.5in;']").each(function(index, item) {
        var text = $(this).text()
        var statement = {
          "text": text,
          "sigin_list": []
        }
        $(this).parent().find("img").each(function(index, img_item) {
          statement['sigin_list'].push(KET_URL + $(img_item).attr("src"))
        })
        section['statement_list'].push(statement)
      })
    data['section_list'].push(section)
  })

  return data
}

function parsevehicleMarkings(body) {
  var $ = cheerio.load(body)
  var data = {
    "name": "TRANSPORTO PRIEMONIŲ SKIRIAMIEJI IR INFORMACINIAI ŽENKLAI TRANSPORTO PRIEMONĖSE",
    "section_list": []
  }

  $("*").find("p[style^='text-align:justify;text-indent:.5in;']").each(function(index, item) {
    var text = $(this).text()
    var statement = {
      "text": text,
      "sigin_list": []
    }
    $(this).parent().find("img").each(function(index, img_item) {
      statement['sigin_list'].push(KET_URL + $(img_item).attr("src"))
    })
    data['section_list'].push(statement)
  })

  return data
}
