/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/time.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
    of various kinds.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

    Use, modification, and redistribution of this program is permitted
    under either the GNU General Public License (GPL) Version 2 (or
    any later version) or under the GNU Lesser General Public License
    (version 3 or later).

    These licenses may be found at www.gnu.org, particularly:
      http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
      http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

/* Time functions */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.Time=
    (function (){
        "use strict";

        function _(x){ return x; }

        function fdjtTime() {
            return (new Date()).getTime();}

        var loaded=fdjtTime.loaded=(new Date()).getTime();
        fdjtTime.tick=function(){
            return Math.floor((new Date()).getTime()/1000);};

        fdjtTime.dateString=function(tstamp){
            if (typeof tstamp === 'number') {
                if (tstamp<131592918600)
                    tstamp=new Date(tstamp*1000);
                else tstamp=new Date(tstamp);}
            return tstamp.toDateString();};
        fdjtTime.timeString=function(tstamp){
            if (typeof tstamp === 'number') {
                if (tstamp<131592918600)
                    tstamp=new Date(tstamp*1000);
                else tstamp=new Date(tstamp);}
            return tstamp.toString();};

        function shortString(tstamp){
            var now=new Date();
            if (typeof tstamp === 'number') {
                if (tstamp<131592918600)
                    tstamp=new Date(tstamp*1000);
                else tstamp=new Date(tstamp);}
            var diff=(now.getTime()-tstamp.getTime())/1000;
            if (diff>(12*3600))
                return tstamp.toDateString();
            else {
                var hours=tstamp.getHours();
                var minutes=tstamp.getMinutes();
                return tstamp.toDateString()+" ("+
                    ((hours<10)?"0":"")+hours+":"+
                    ((minutes===0)?"00":(((minutes<10)?"0":"")+minutes))+
                    ")";}}
        fdjtTime.shortString=shortString;
        fdjtTime.tick2shortstring=function(tick){
            return shortString(new Date(tick*1000));};

        var first_date=false;
        function compactString(tstamp,curdate){
            if (typeof tstamp === 'number') {
                if (tstamp<131592918600)
                    tstamp=new Date(tstamp*1000);
                else tstamp=new Date(tstamp);}
            var date_string=tstamp.toLocaleDateString();
            if (typeof curdate==="undefined") {
                if (first_date) curdate=first_date;
                else first_date=new Date().toLocaleDateString();}
            var show_date=(date_string!==curdate);
            var hours=tstamp.getHours(), minutes=tstamp.getMinutes();
            var seconds=tstamp.getSeconds();
            return ((show_date)?(date_string):(""))+
                ((show_date)?(" - "):(""))+
                ((hours<10)?"0":"")+hours+":"+
                ((minutes===0)?"00":(((minutes<10)?"0":"")+minutes))+":"+
                ((seconds===0)?"00":(((seconds<10)?"0":"")+seconds));}
        fdjtTime.compactString=compactString;
        
        fdjtTime.tick2string=function(tick){
            return (new Date(tick*1000)).toString();};
        fdjtTime.tick2date=function(tick){
            return (new Date(tick*1000)).toDateString();};
        fdjtTime.tick2locale=function(tick){
            return (new Date(tick*1000)).toLocaleString();};
        fdjtTime.tick2time=function(tick){
            return (new Date(tick*1000)).toTimeString();};

        var fmt=fdjt.String;

        fdjtTime.secs2string=function(interval){
            var weeks, days, hours, minutes, seconds;
            if (interval<1)
                return fmt("%f seconds",interval);
            else if (interval===1)
                return fmt("%f second",interval);
            else if (interval<10)
                return fmt("%f seconds",interval);
            else if (interval<60)
                return fmt("~%d seconds",Math.round(interval/60));
            else if (interval<120) {
                minutes=Math.floor(interval/60);
                seconds=Math.round(interval-(minutes*60));
                if (seconds===1)
                    return _("one minute, one second");
                else return fmt("one minute, %d seconds",seconds);}
            else if (interval<3600) {
                minutes=Math.floor(interval/60);
                return fmt("~%d minutes",minutes);}
            else if (interval<(2*3600)) {
                hours=Math.floor(interval/3600);
                minutes=Math.round((interval-(hours*3600))/60);
                if (minutes===1)
                    return _("one hour and one minutes");
                else return fmt("one hour, %d minutes",minutes);}
            else if (interval<(24*3600)) {
                hours=Math.floor(interval/3600);
                return fmt("~%d hours",hours);}
            else if (interval<(2*24*3600)) {
                hours=Math.floor((interval-24*3600)/3600);
                if (hours===1)
                    return _("one day and one hour");
                else return fmt("one day, %d hours",hours);}
            else if (interval<(7*24*3600)) {
                days=Math.floor(interval/(24*3600));
                return fmt("%d days",days);}
            else if (interval<(14*24*3600)) {
                days=Math.floor((interval-(7*24*3600))/(24*3600));
                if (days===1)
                    return "one week and one day";
                else return fmt("one week and %d days",days);}
            else {
                weeks=Math.floor(interval/(7*24*3600));
                days=Math.round((interval-(days*7*24*3600))/(7*24*3600));
                return fmt("%d weeks, %d days",weeks,days);}};

        fdjtTime.secs2short=function(interval){
            // This is designed for short intervals
            if (interval<0.001)
                return Math.round(interval*1000000)+"us";
            else if (interval<0.1)
                return Math.round(interval*1000)+"ms";
            else if (interval<120)
                return (Math.round(interval*100)/100)+"s";
            else {
                var min=Math.floor(interval/60);
                var secs=interval-min*60;
                return min+"m, "+(Math.round(secs*100)/100)+"s";}};

        fdjtTime.runTimes=function(pname,start){
            var point=start; var report="";
            var i=2; while (i<arguments.length) {
                var phase=arguments[i++]; var time=arguments[i++];
                report=report+"; "+phase+": "+
                    ((time.getTime()-point.getTime())/1000)+"s";
                point=time;}
            return pname+" "+
                ((point.getTime()-start.getTime())/1000)+"s"+
                report;};

        fdjtTime.diffTime=function(time1,time2){
            if (!(time2)) time2=new Date();
            var diff=time1.getTime()-time2.getTime();
            if (diff>0) return diff/1000; else return -(diff/1000);};

        fdjtTime.ET=function(arg){
            if (!(arg)) arg=new Date();
            return (arg.getTime()-loaded)/1000;};

        var tzpat=/(EST|EDT|PDT|PST|CST|CDT|ECT|GMT|Z|([+-]\d\d?(:\d+)?))$/i;

        fdjtTime.parse=function(string){
            var value=false;
            try {
                if (Date.parse)
                    value=new Date(Date.parse(string));
                else value=new Date(string);
            } catch (ex) {
                fdjt.Log("Error parsing time '%s': %o",string,ex);}
            if ((value instanceof Date)&&(!(isNaN(value.getYear()))))
                return value;
            else {
                var strip=string.search(tzpat);
                if (strip>0) return fdjtTime.parse(string.slice(0,strip));
                fdjt.Log("Couldn't parse time '%s'",string);
                return string;}};
        
        fdjtTime.timeslice=fdjt.Async.timeslice;
        fdjtTime.slowmap=fdjt.Async.slowmap;

        return fdjtTime;})();

fdjt.ET=fdjt.Time.ET;

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  indent-tabs-mode: nil ***
;;;  End: ***
*/
