// ==UserScript==
// @name       PUC Foglio presenze
// @namespace  http://zucchetti.cl-grp.local:8080/
// @version    4.5
// @updateURL      https://raw.githubusercontent.com/teejay-87/puc-foglio-presenze/master/PUC-Foglio-presenze.meta.js
// @downloadURL    https://raw.githubusercontent.com/teejay-87/puc-foglio-presenze/master/PUC-Foglio-presenze.user.js
// @description  Plugin foglio presenze per calcolo ora di uscita
// @match      http://zucchetti.cl-grp.local:8080/HR-WorkFlow/jsp/hfpr_cartellino.jsp*
// @match      http://zucchetti.cl-grp.local:8080/HR-WorkFlow/servlet/hfpr_bcapcarte*
// @copyright  2012-2020, Tommaso Sala / Denis Ironi
// ==/UserScript==

var jQ, hfpr_wcartellino2c$;

function addJQuery(callback) {
    var script = document.createElement("script");
    script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js");
    script.addEventListener('load', function() {
        var script = document.createElement("script");
        script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
        document.body.appendChild(script);
    }, false);
    document.body.appendChild(script);
}

function addCustomPluginCode() {

    var imageUrl = "https://cdn1.iconfinder.com/data/icons/pixelo/32/bell.png";

    var currentGoHomeDiv;
    var currentGoHomeWithFlexDiv;

    var notifiedGoHome = false;
    var notifiedGoHomeWithFlex = false;

    var goHomeHourForToday = 0;
    var goHomeMinForToday = 0;
    var goHomeHourWithFlexForToday = 0;
    var goHomeMinWithFlexForToday = 0;

    var notExecutedForTimes = 0;

    var currentYear = 0;
    var currentMonth = 0;

    var intrvlIterations = 0;
    var intrvl;
    var srcCloseBtnInt;

    var buttonsPlaced = false;


    var re_init = function()
    {
        clearInterval(intrvl);

        notifiedGoHome = false;
        notifiedGoHomeWithFlex = false;

        goHomeHourForToday = 0;
        goHomeMinForToday = 0;
        goHomeHourWithFlexForToday = 0;
        goHomeMinWithFlexForToday = 0;

        notExecutedForTimes = 0;

        currentYear = 0;
        currentMonth = 0;

        intrvlIterations = 0;
        intrvl = setInterval(mainProgram, 100);
    }

    var srcCloseBtnFn = function()
    {
        var modalWinCloseButton = jQ("div[id^=spModalLayer_closebtn_]");
        if (modalWinCloseButton.length > 0)
        {
            clearInterval(srcCloseBtnInt);
            jQ(modalWinCloseButton).click(function() { setTimeout(function() { location.reload() }, 100); });
        }
    }

    setTimeout(function(){

        var monthChanger = jQ("select[id$=_TxtMese]");
        var yearChanger = jQ("select[id$=_TxtAnno]");
        var prevMonthBtn = jQ('a[id$="_BtnMesePrev"]');
        var nextMonthBtn = jQ('a[id$="_BtnMeseNext"]');

        jQ(monthChanger).change(re_init);
        jQ(yearChanger).change(re_init);
        jQ(prevMonthBtn).click(re_init);
        jQ(nextMonthBtn).click(re_init);

        // hook functions to intercept opening of modal windows
        ['viewAnom', 'viewTimbra', 'openSendGstf', 'modallayer'].forEach(function(fn) {
            var originalFn = hfpr_wcartellino2c$[fn];
            hfpr_wcartellino2c$[fn] = function() { var ret = originalFn.apply(this, arguments); srcCloseBtnInt = setInterval(srcCloseBtnFn, 1000); return ret; }
        });

    }, 100);


    var checkTimeForRefresh = function()
    {
        var d = new Date();

        if (d.getMinutes() % 15 == 5 && d.getSeconds() == 0) {
            location.reload();
        }
    };

    var checkTime = function()
    {
        var d = new Date();

        if ((d.getHours() > goHomeHourForToday) ||
            (d.getHours() == goHomeHourForToday &&
             d.getMinutes() >= goHomeMinForToday))
        {
            if (!notifiedGoHome) {
                currentGoHomeDiv.css("color", "limegreen");

                if (Notification.permission == "granted") {
                    new Notification("PUC", { body: 'Hai fatto 8 ore, puoi andare a casa!', icon: imageUrl });
                }

                notifiedGoHome = true;
            }
        }
        else
        {
            currentGoHomeDiv.css("color", "red");
        }


        if (d.getHours() >= 17 &&
            ((d.getHours() > goHomeHourWithFlexForToday) ||
             (d.getHours() == goHomeHourWithFlexForToday &&
              d.getMinutes() >= goHomeMinWithFlexForToday)))
        {
            if (!notifiedGoHomeWithFlex) {
                currentGoHomeWithFlexDiv.css("color", "limegreen");

                if (Notification.permission == "granted") {
                    new Notification("PUC", { body: 'Hai recuperato il flex, puoi andare a casa!', icon: imageUrl });
                }

                notifiedGoHomeWithFlex = true;
            }
        }
        else
        {
            currentGoHomeWithFlexDiv.css("color", "red");
        }


        if (notifiedGoHome && notifiedGoHomeWithFlex) {
            clearInterval(intrvl);
            //alert("cleared");
        }
    };

    var formatTime = function(neg, hour, mins)
    {
        return (neg ? "-" : "") + hour + "." + (mins>9 ? mins : "0" + mins);
    };


    /* ENGLISH
    var modifyFlex = function(jQObject, amount)
    {
        if (jQObject.children().length > 0)
            jQObject = jQ(jQObject.children()[0]).children().children().children().children();

        var currMinHour = jQObject.text().trim().split('.');

        var currTotalMins = (currMinHour[0].indexOf("-")!=-1 ? -1 : +1)*
                            ((currMinHour[0].indexOf("-")!=-1 ? parseInt(currMinHour[0].substring(1)) : parseInt(currMinHour[0]))*60 + parseInt(currMinHour[1]));

        if (isNaN(currTotalMins))
            return;

        var correctedTotalMins = currTotalMins + amount;
        var correctedTotalMinsAbs = Math.abs(correctedTotalMins);
        var correctedMins = correctedTotalMinsAbs % 60;
        var correctedHour = (correctedTotalMinsAbs - correctedMins)/60;

        var formattedTime = formatTime(correctedTotalMins<0, correctedHour, correctedMins);

        jQObject.html(formattedTime);
    };

    var engCourseStarted = function(day)
    {
        if ((currentYear > 2014) ||
            (currentYear == 2014 && currentMonth > 3) ||
            (currentYear == 2014 && currentMonth == 3 && day > 9))
        {
            return true;
        }
        else
        {
            return false;
        }
    };
    */



    /* ENGLISH
    // POP UP SELEZIONE GIORNI SETTIMANA

    var days = new Array("Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì");

    function showEnglishDaysPopup()
    {
        for (var gg = 0; gg < 5; gg++) {
            //alert('englishDays_gg_'+ days[gg].substring(0,3).toUpperCase() + ": " + localStorage['englishDays_gg_'+ days[gg].substring(0,3).toUpperCase()]);
            jQ("#chkboxEnglishDays_gg_" + days[gg].substring(0,3).toUpperCase()).prop('checked', localStorage['englishDays_gg_'+ days[gg].substring(0,3).toUpperCase()] == "true");
        }
        jQ(".pagelet").fadeTo("fast",0.3, function() {jQ(".pagelet").on("click", hideEnglishDaysPopup);});
        jQ("#divEnglishDays").show();
        var top=(jQ(window).height()/2)-150;
        var left=(jQ(window).width()/2)-100;
        jQ("#divEnglishDays").css({'left':left,'top':top,'position':'absolute'});
    }

    function hideEnglishDaysPopup()
    {
        jQ("#divEnglishDays").hide();
        jQ(".pagelet").fadeTo("fast",1, function() {jQ(".pagelet").off("click", hideEnglishDaysPopup);});
    }

    function saveEnglishDays()
    {
        for (var gg = 0; gg < 5; gg++)
        {
            localStorage['englishDays_gg_'+ days[gg].substring(0,3).toUpperCase()] = jQ("#chkboxEnglishDays_gg_" + days[gg].substring(0,3).toUpperCase()).is(':checked');
        }
        location.reload();
    }

    var divEnglishDays = document.createElement("div");
    divEnglishDays.setAttribute("id", "divEnglishDays");
    document.body.appendChild(divEnglishDays);
    jQ("#divEnglishDays").hide();
    jQ("#divEnglishDays").css({'background-color':'white', 'border-style':'solid', 'border-width':'1px', 'border-color':'black', 'padding':'10px'});

    jQ("#divEnglishDays").html("<span class='Title'>SELEZIONA I GIORNI DEL CORSO:</span><br/><br/>");
    for (var gg = 0; gg < 5; gg++)
    {
        jQ("#divEnglishDays").html(jQ("#divEnglishDays").html()+"<input type='checkbox' id='chkboxEnglishDays_gg_" + days[gg].substring(0,3).toUpperCase() + "'> " + days[gg] + "<br/>");
    }
    jQ("#divEnglishDays").html(jQ("#divEnglishDays").html()+"<br/><center><button id='btnConfirmEnglishDays'>Ok</button>&nbsp;&nbsp;&nbsp;<button id='btnCancelEnglishDays'>Annulla</button></center>");
    jQ("#btnConfirmEnglishDays").on("click", saveEnglishDays);
    jQ("#btnCancelEnglishDays").on("click", hideEnglishDaysPopup);

    // FINE POP UP SELEZIONE GIORNI SETTIMANA
    */



    function mainProgram()
    {
        // compatto gli elementi dell'header su una singola riga
        var lowHeightHeaderStyle = `
            .hfpr_welencodip2c_portlet > .LblPeriodo2_ctrl { top: 0px !important; margin-left: 709px !important }
            .hfpr_welencodip2c_portlet > .TxtMese_ctrl, .hfpr_welencodip2c_portlet > .TxtAnno_ctrl, .hfpr_welencodip2c_portlet > .BtnMeseNext_ctrl { top: 18px !important; margin-left: 700px !important }
            .hfpr_welencodip2c_portlet > .BtnMesePrev_ctrl { top: 18px !important; margin-left: 710px !important }
            .hfpr_welencodip2c_portlet > .LblDipn_Copy_ctrl { top: 0px !important; margin-left: 400px !important }
            .hfpr_welencodip2c_portlet > .LblXEmploy_ctrl { top: 18px !important; margin-left: 400px !important }
        `;
        var lowHeightHeaderStyleSheet = document.createElement("style");
        lowHeightHeaderStyleSheet.type = "text/css";
        lowHeightHeaderStyleSheet.innerText = lowHeightHeaderStyle;
        document.body.appendChild(lowHeightHeaderStyleSheet);
        // imposto un handler che gestisce il resize della window nonché il primo show se il tab non è visibile
        var handleResize = function() {
            // diminuisco l'altezza dell'header
            jQ("div[class*=hfpr_welencodip2c_portlet]").css("height", "50px");
            // rimuovo il doppio scroller
            setTimeout(function() {
                jQ("div[id$=_Grid1_container]")[0].style.height = "";
                jQ("div[id$=_Grid1_scroller]")[0].style.height = "";
                jQ("div[id$=_Grid1_scroller]")[0].style.marginBottom = "25px";
            }, 700);
        }
        handleResize();
        jQ(window).resize(function() { setTimeout(function() { handleResize(); }, 300); });
        jQ(window).focus(function() { jQ(window).off('focus'); setTimeout(function() { handleResize(); }, 300); });
        // diminuisco l'altezza delle righe
        jQ("tr[id*=_Grid1_row]").each(function(index, value){ value.style.height="25px"; });
        // tolgo il padding intorno alle celle
        var lowHeightGridStyle = `
            .grid .grid_rowodd td, .grid .grid_row td { padding: 0px 4px !important; }
            .grid .grid_rowodd td { background-color: #FAFAFA; }
            .grid tr:hover td { background-color: #EEEEEE; }
        `;
        var lowHeightGridStyleSheet = document.createElement("style");
        lowHeightGridStyleSheet.type = "text/css";
        lowHeightGridStyleSheet.innerText = lowHeightGridStyle;
        document.body.appendChild(lowHeightGridStyleSheet);
        // tolgo il margin di alcune celle
        jQ("td[id*=_Grid1_][id$=_0],td[id*=_Grid1_][id$=_7],td[id*=_Grid1_][id$=_8],td[id*=_Grid1_][id$=_9]").each(function(index, value){ jQ(value).children().children().css('margin-top', '3px'); });
        jQ("td[id*=_Grid1_][id$=_1]").each(function(index, value){ jQ(value).children().children().css('margin-top', '4px'); });
        jQ("td[id*=_Grid1_][id$=_3]").each(function(index, value){ jQ(value).children().children().css('margin-top', '1px'); });
        jQ("td[id*=_Grid1_][id$=_5]").each(function(index, value){ jQ(jQ(value).children().children()[0]).css('margin-top', '2px'); });


        var weekDay = jQ("div[id*=Grid1_][id$=_0_viewDiv]"); // campo giorno della settimana
        var timesDiv = jQ("div[id*=Grid1_][id$=_3_viewDiv]"); // campo delle timbrature
        var todayFlex = jQ("div[id*=Grid1_][id$=_8_viewDiv]"); // campo del flex giornaliero
        var flex = jQ("div[id*=Grid1_][id$=_9_viewDiv]"); // campo del flex cumulativo
        var orario = jQ("div[id*=Grid1_][id$=_4_viewDiv]"); // campo giustificativi, dove verrà aggiunto l'orario di uscita dal plugin

        var executed = false; // viene impostato a true quando il main program è stato eseguito, ovvero sono stati piazzati gli orari di uscita
        intrvlIterations++;

        var monthTimeTypeSet = false;
        var progFlexTotalMins = 0; // utilizzato se il tipo di orario del mese non è impostato (N.A.)

        jQ(timesDiv).each(function(index, value){

            var valueToPrint = "";
            var goHomeHour = 0;
            var goHomeMin = 0;

            var goHomeHourWithFlex, goHomeMinWithFlex;

            var spansInTimesDiv = jQ(value).children().children().children().children().children("span");
            if (spansInTimesDiv.length == 0) {
                return;
            }

            var e1Val = jQ(spansInTimesDiv[0]).text().trim();
            var u1Val = jQ(spansInTimesDiv[1]).text().trim();
            var e2Val = jQ(spansInTimesDiv[2]).text().trim();
            var u2Val = jQ(spansInTimesDiv[3]).text().trim();

            var e1MinHour, u1MinHour, e2MinHour;

            var flexVal = jQ(jQ(flex)[index-1]).text().trim();
            var flexHour = 0;
            var flexMin = 0;

            var wdVal = jQ(jQ(weekDay)[index]).text().trim().substring(2).trim().toUpperCase();

            if (flexVal != "")
            {
                var flexValAbs;

                var flexNeg = flexVal.substring(0,1) == "-";
                if (flexNeg) {
                    flexValAbs = flexVal.substring(1);
                } else {
                    flexValAbs = flexVal;
                }

                var flexMinHour = flexValAbs.split(':');

                flexHour = flexMinHour[0] * (flexNeg ? -1 : +1);
                flexMin = flexMinHour[1] * (flexNeg ? -1 : +1);
            }

            /* TODO
            // controllo errori timbratura
            if (e1Val==null && u1Val!=null && e2Val!=null && jQ(jQ(u2)[index]).children().children().next().html() != null)
            {
                e1Val = u1Val;
                u1Val = e2Val;
                e2Val = jQ(jQ(u2)[index]).children().children().next().html();
            }
            */


            if (e1Val != "" && u1Val != "" && e2Val != "")
            {
                // se le prime tre timbrature sono compilate, calcolo l'ora di uscita di conseguenza

                if (!executed)
                {
                    currentYear = parseInt(jQ(jQ("select[id$=_TxtAnno]")[0]).find('option:selected').text());
                    currentMonth = jQ(jQ("select[id$=_TxtMese]")[0]).prop("selectedIndex");
                }

                executed = true;

                e1MinHour = e1Val.split(':');
                // correzione per ritardi fino alle 9:45
                if (e1MinHour[0] == 9 && e1MinHour[1] > 30 && e1MinHour[1] <= 45) {
                    e1MinHour[1] = 45;
                }
                // correzione per ritardi oltre le 9:45 (è necessario permesso dalle 9:30)
                else if ((e1MinHour[0] == 9 && e1MinHour[1] > 45) || e1MinHour[0] > 9) {
                    e1MinHour[0] = 9;
                    e1MinHour[1] = 30;
                }

                u1MinHour = u1Val.split(':');
                // correzione per uscita dopo le 13.30
                if (u1MinHour[0] == 13 && u1MinHour[1] > 30) {
                    u1MinHour[1] = 30;
                }

                e2MinHour = e2Val.split(':');

                var morningWorkHour = u1MinHour[0] - e1MinHour[0];
                var morningWorkMin = u1MinHour[1] - e1MinHour[1];

                if (morningWorkMin < 0)
                {
                    morningWorkHour = morningWorkHour -1;
                    morningWorkMin = 60 + morningWorkMin;
                }

                var waitForHomeHour = 7 - morningWorkHour;
                var waitForHomeMin = 60 - morningWorkMin;

                // correzione se pausa pranzo minore di 30 minuti
                var lunchBreakDuration = (e2MinHour[0] - u1MinHour[0]) * 60 + (e2MinHour[1] - u1MinHour[1]);
                if (lunchBreakDuration < 30) {
                    waitForHomeMin = waitForHomeMin + (30 - lunchBreakDuration);
                    if (waitForHomeMin >= 60)
                    {
                        waitForHomeHour = waitForHomeHour + 1;
                        waitForHomeMin = waitForHomeMin - 60;
                    }
                }
                // correzione per ritardi oltre le 14:15 (è necessario permesso dalle 14:00)
                else if ((e2MinHour[0] == 14 && e2MinHour[1] > 15) || e2MinHour[0] > 14) {
                    e2MinHour[0] = 14;
                    e2MinHour[1] = 0;
                }

                goHomeHour = waitForHomeHour + parseInt(e2MinHour[0]);
                goHomeMin = parseInt(e2MinHour[1]) + waitForHomeMin;

                if (goHomeMin >= 60)
                {
                    goHomeHour = goHomeHour + 1;
                    goHomeMin = goHomeMin - 60;
                }

                if (goHomeMin < 10) {
                    goHomeMin = "0" + goHomeMin;
                }


                // con conteggio flex

                var waitForHomeHourWithFlex = 7 - (morningWorkHour + flexHour);
                var waitForHomeMinWithFlex = 60 - (morningWorkMin + flexMin);

                if (flexMin + morningWorkMin >= 60)
                {
                    waitForHomeHourWithFlex -= 1;
                    waitForHomeMinWithFlex += 60;
                }

                goHomeHourWithFlex = waitForHomeHourWithFlex + parseInt(e2MinHour[0]);
                goHomeMinWithFlex = parseInt(e2MinHour[1]) + waitForHomeMinWithFlex;

                while(goHomeMinWithFlex >= 60)
                {
                    goHomeHourWithFlex = goHomeHourWithFlex + 1;
                    goHomeMinWithFlex = goHomeMinWithFlex - 60;
                }

                if (goHomeMinWithFlex < 10) {
                    goHomeMinWithFlex = "0" + goHomeMinWithFlex;
                }

                /*
                if (goHomeHourWithFlex < 17)
                {
                    goHomeHourWithFlex = "17";
                    goHomeMinWithFlex = "00";
                }
                */

                // fine conteggio flex

            }
            else if (e1Val != "" && e2Val == "")
            {
                // se solo la prima entrata è compilata, calcolo l'ora di uscita considerando 30 minuti di pausa pranzo

                if (!executed)
                {
                    currentYear = parseInt(jQ(jQ("select[id$=_TxtAnno]")[0]).find('option:selected').text());
                    currentMonth = jQ(jQ("select[id$=_TxtMese]")[0]).prop("selectedIndex");
                }

                executed = true;

                e1MinHour = e1Val.split(':');
                // correzione per ritardi fino alle 9:45
                if (e1MinHour[0] == 9 && e1MinHour[1] > 30 && e1MinHour[1] <= 45) {
                    e1MinHour[1] = 45;
                }
                // correzione per ritardi oltre le 9:45 (è necessario permesso dalle 9:30)
                else if ((e1MinHour[0] == 9 && e1MinHour[1] > 45) || e1MinHour[0] > 9) {
                    e1MinHour[0] = 9;
                    e1MinHour[1] = 30;
                }

                goHomeHour = (e1MinHour[0] < 13 ? 8 : 4) + parseInt(e1MinHour[0]);

                goHomeMin = parseInt(e1MinHour[1]) + (e1MinHour[0] < 13 ? 30 : 0);

                if (goHomeMin >= 60)
                {
                    goHomeHour = goHomeHour + 1;
                    goHomeMin = goHomeMin - 60;
                }

                if (goHomeMin < 10) {
                    goHomeMin = "0" + goHomeMin;
                }


                // con conteggio flex

                goHomeHourWithFlex = (e1MinHour[0] < 13 ? 8 : 4) + parseInt(e1MinHour[0]) - flexHour;
                goHomeMinWithFlex = parseInt(e1MinHour[1]) + (e1MinHour[0] < 13 ? 30 : 0) - flexMin;

                if (goHomeMinWithFlex < 0)
                {
                    goHomeHourWithFlex -= 1;
                    goHomeMinWithFlex += 60;
                }

                while(goHomeMinWithFlex >= 60)
                {
                    goHomeHourWithFlex = goHomeHourWithFlex + 1;
                    goHomeMinWithFlex = goHomeMinWithFlex - 60;
                }

                if (goHomeMinWithFlex < 10) {
                    goHomeMinWithFlex = "0" + goHomeMinWithFlex;
                }

                /*
                if (goHomeHourWithFlex < 17)
                {
                    goHomeHourWithFlex = "17";
                    goHomeMinWithFlex = "00";
                }
                */

                // fine conteggio flex
            }

            if (goHomeHour != 0 || goHomeMin != 0)
            {
                var d = new Date();
                var n = d.getDate();

                goHomeHourWithFlex = goHomeHourWithFlex % 24;
                if (goHomeHourWithFlex < 10) {
                    goHomeHourWithFlex = "0" + goHomeHourWithFlex;
                }

                valueToPrint = ""; // ENGLISH - "<input type='checkbox' id='engCourse_" + index + "'> ";

                if (n-1 == index)
                {
                    goHomeHourForToday = goHomeHour;
                    goHomeMinForToday = goHomeMin;
                    goHomeHourWithFlexForToday = goHomeHourWithFlex;
                    goHomeMinWithFlexForToday = goHomeMinWithFlex;

                    valueToPrint += "<span id='currentGoHome' style='font-weight:bold'>" + goHomeHour + ":" + goHomeMin + "</span>";
                    valueToPrint += " / <span id='currentGoHomeWithFlex' style='font-weight:bold'>" + goHomeHourWithFlex + ":" + goHomeMinWithFlex + "</span> with flex";
                }
                else
                {
                    valueToPrint += "<span id='otherGoHome' style='font-weight:bold'>" + goHomeHour + ":" + goHomeMin + "</span>";
                    valueToPrint += " / <span id='otherGoHomeWithFlex' style='font-weight:bold'>" + goHomeHourWithFlex + ":" + goHomeMinWithFlex + "</span> with flex";


                    // se il tipo di orario del mese non è impostato (N.A.) procedo a segnare programmaticamente il flex, in rosso bold
                    if (!monthTimeTypeSet && jQ(jQ(flex)[index]).text().trim() == "") {

                        var _8hourExit = new Date();
                        _8hourExit.setHours(goHomeHour);
                        _8hourExit.setMinutes(goHomeMin);

                        var u2MinHour = u2Val.split(':');

                        var _actualExit = new Date();
                        _actualExit.setHours(u2MinHour[0]);
                        _actualExit.setMinutes(u2MinHour[1]);

                        var todayFlexTotalMins = (_actualExit - _8hourExit)/1000/60;
                        var todayFlexTotalMinsAbs = Math.abs(todayFlexTotalMins);

                        var todayFlexMins = ("00" + todayFlexTotalMinsAbs % 60).substr(-2,2);
                        var todayFlexHour = (todayFlexTotalMinsAbs - todayFlexMins)/60;

                        jQ(jQ(todayFlex)[index]).html("<span style='color: red; font-weight: bold'>&nbsp;&nbsp;" + (todayFlexTotalMins<0 ? "-" : "") + todayFlexHour + ":" + todayFlexMins + "</span>");

                        progFlexTotalMins += todayFlexTotalMins;
                        var progFlexTotalMinsAbs = Math.abs(progFlexTotalMins);

                        var progFlexMins = ("00" + progFlexTotalMinsAbs % 60).substr(-2,2);
                        var progFlexHour = (progFlexTotalMinsAbs - progFlexMins)/60;

                        jQ(jQ(flex)[index]).html("<span style='color: red; font-weight: bold'>" + (progFlexTotalMins<0 ? "-" : "") + progFlexHour + ":" + progFlexMins + "</span>");

                    } else {

                        // altrimenti mi salvo che il tipo di orario del mese è impostato
                        monthTimeTypeSet = true;
                    }
                }

                jQ(orario[index]).html("<table><tr><td width='140'><div id='goHome_row_" + index + "' valign='middle' align='left' style='float: left;'>" + valueToPrint + "</div></td><td>" + jQ(jQ(orario)[index]).html() + "</td></tr></table>");


                /* BOH!
                // centro eventuali giustificativi
                jQ(orario[index]).children("table")[0].align = "center"
                jQ(jQ(orario[index]).children("table")[0]).find("td").each(function(index, value) { jQ(value).css("width", "") })
                */


                /* ENGLISH
                // al cambiamento di una checkbox del corso di inglese
                jQ("#engCourse_"+index).change(function(){

                    var currCheckBox = this;
                    var row = parseInt(currCheckBox.id.substring(10));

                    // sistemo l'ora di uscita senza flex per il giorno selezionato
                    var currGoHome = jQ("div[id^=goHome_row_"+row+"] > span[id$=GoHome]");
                    modifyFlex(jQ(currGoHome), currCheckBox.checked ? 30 : -30);

                    // sistemo il flex singolo per il giorno selezionato
                    modifyFlex(jQ(jQ(todayFlex)[index]), currCheckBox.checked ? -30 : 30);

                    // sistemo i flex cumulativi per il giorno selezionato e per tutti i giorni seguenti
                    jQ(timesDiv).each(function(ix, vl){
                        if (ix < row) return;
                        modifyFlex(jQ(jQ(flex)[ix]), currCheckBox.checked ? -30 : 30);
                    });

                    // sistemo l'ora di uscita con flex per il giorno selezionato e per tutti i giorni seguenti
                    var allGoHomesWithFlex = jQ("div[id^=goHome_row_] > span[id$=GoHomeWithFlex]");
                    jQ(allGoHomesWithFlex).each(function(ix, vl){
                        if (parseInt(jQ(vl).parent().attr('id').substring(11)) < row) return;
                        modifyFlex(jQ(vl), currCheckBox.checked ? 30 : -30);
                    });

                    // ricalcolo le variabili che mantengono l'ora di uscita per oggi, con e senza flex, utilizzate per le notifiche push
                    if (row <= n-1) {
                        if (goHomeHourWithFlexForToday > 0) {

                            var newFlexDate = new Date();
                            newFlexDate.setHours(goHomeHourWithFlexForToday);
                            newFlexDate.setMinutes(goHomeMinWithFlexForToday);
                            newFlexDate.setTime(newFlexDate.getTime() + (currCheckBox.checked ? (30 * 60 * 1000) : -(30 * 60 * 1000)));

                            goHomeHourWithFlexForToday = newFlexDate.getHours();
                            goHomeMinWithFlexForToday = newFlexDate.getMinutes();
                        }
                    }

                    // salvo il valore della checkbox nel localStorage
                    if ((localStorage['englishDays_gg_'+ wdVal] == "true" && !currCheckBox.checked) || (localStorage['englishDays_gg_'+ wdVal] != "true" && currCheckBox.checked))
                        { localStorage['englishDays_date_'+currentYear+'_'+currentMonth+'_'+(row+1)] = currCheckBox.checked; }
                        else
                        { localStorage.removeItem('englishDays_date_'+currentYear+'_'+currentMonth+'_'+(row+1)); }
                });

                // triggero un evento di click sul checkbox se risulta selezionato nel localStorage, in modo da attivarlo
                if (engCourseStarted(index+1)) {
                    if ((localStorage['englishDays_gg_'+ wdVal] == "true" &&
                         localStorage['englishDays_date_'+currentYear+'_'+currentMonth+'_'+(index+1)] != "false") ||
                        localStorage['englishDays_date_'+currentYear+'_'+currentMonth+'_'+(index+1)] == "true")
                         jQ("#engCourse_"+index).trigger("click");
                } else {
                    jQ("#engCourse_"+index).attr("disabled", true);
                }
                */
            }
        });

        if (executed || intrvlIterations >= 30)
        {
            clearInterval(intrvl);

            /* NOTIFICATIONS & ENGLISH
            if (!buttonsPlaced)
            {
                var tabTotalizzatori = jQ("div[id$=_TABSCONTAINER_tabs_mask] > div[id$=_TABSCONTAINER] > div[id$=_TAB_ITEM]").
                                                filter(function() { return jQ(this).width() > 0 && jQ(this).height() > 0; }).last();

                // POP UP SELEZIONE GIORNI SETTIMANA
                var tabGiorniInglese = tabTotalizzatori.clone();
                tabTotalizzatori.after(tabGiorniInglese);

                tabGiorniInglese.find("a").filter(function() { return jQ(this).html() == "Totalizzatori"; }).html("SCELTA GIORNI INGLESE");
                tabGiorniInglese.find("a").attr("href", "#");
                tabGiorniInglese.find("a").click(function(){
                        showEnglishDaysPopup();
                });

                // SUPPORTO NOTIFICHE
                if (Notification.permission == "default") {

                    var tabAbilitaNotifiche = tabTotalizzatori.clone();
                    tabGiorniInglese.after(tabAbilitaNotifiche);

                    tabAbilitaNotifiche.find("a").filter(function() { return jQ(this).html() == "Totalizzatori"; }).html("ABILITA NOTIFICHE");
                    tabAbilitaNotifiche.find("a").attr("href", "#");
                    tabAbilitaNotifiche.find("a").click(function(){
                        Notification.requestPermission();
                        tabAbilitaNotifiche.detach();
                    });

                    alert("Premi il pulsante \"Abilita notifiche\" per autorizzare o negare le notifiche desktop sull'orario di uscita!");
                }

                buttonsPlaced = true;
            }
            */


            currentGoHomeDiv = jQ('#currentGoHome');
            currentGoHomeWithFlexDiv = jQ('#currentGoHomeWithFlex');


            if (currentGoHomeDiv.html() == null || currentGoHomeWithFlexDiv.html() == null)
            {
                // ciclo per refreshare quando sono le 4.05 (e comunque ogni 15 minuti per mantenere il login)
                intrvl = setInterval(checkTimeForRefresh, 1000);
            }
            else if ((new Date()).getHours() < 17)
            {
                if (currentYear == (new Date()).getFullYear() && currentMonth == (new Date()).getMonth() + 1) {
                    checkTime();
                }

                // ciclo per refreshare quando sono le 4.05 (e comunque ogni 15 minuti per mantenere il login)
                intrvl = setInterval(checkTimeForRefresh, 1000);
            }
            else
            {
                if (currentYear == (new Date()).getFullYear() && currentMonth == (new Date()).getMonth() + 1) {
                    checkTime();

                    // ciclo di controllo per cambiare colore all'ora di uscita
                    intrvl = setInterval(checkTime, 1000);
                }
            }
        }
        else
        {
            notExecutedForTimes++;
            if (notExecutedForTimes == 5*60*1000/100) {
                location.reload();
            }
        }
    }

    // ciclo di controllo dati pronti per inserire le informazioni sull'orario di uscita
    intrvl = setInterval(mainProgram, 200);
}

// load jQuery and execute the main function
addJQuery(addCustomPluginCode);