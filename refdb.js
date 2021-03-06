/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/refdb.js ###################### */

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

/* global setTimeout, clearTimeout, Promise, window */

fdjt.RefDB=(function(){
    "use strict";
    var fdjtState=fdjt.State;
    var fdjtTime=fdjt.Time;
    var fdjtAsync=fdjt.Async;
    var fdjtDOM=fdjt.DOM;
    var JSON=fdjt.JSON;
    var fdjtLog=fdjt.Log;
    var warn=fdjtLog.warn;

    var refdbs={}, all_refdbs=[], changed_dbs=[], aliases={};

    var iDB=fdjt.iDB;
    var indexedDB=iDB.indexedDB;

    function RefDB(name,init){
        var db=this;
        if (refdbs[name]) {
            db=refdbs[name];
            if ((init)&&(db.init)) {
                if (db.xinits) db.xinits.push(init);
                else db.xinits=[init];}
            else if (init) db.init=init;
            else init={};}
        else if ((init)&&(init.aliases)&&(checkAliases(init.aliases))) {
            db=checkAliases(init.aliases);
            if (db.aliases.indexOf(db.name)>=0) db.name=name;
            if ((init)&&(db.init)) {
                if (db.xinits) db.xinits.push(init);
                else db.xinits=[init];}
            else if (init) db.init=init;
            else init={};}
        else {
            if (!(init)) init={};
            db.name=name; refdbs[name]=db; all_refdbs.push(db);
            db.aliases=[];
            db.complete=false; // Whether all valid refs are loaded
            db.refs={}; // Mapping _ids to refs (unique within the DB)
            db.altrefs={}; // Alternate unique IDs
            // An array of all references to this DB
            db.allrefs=[];
            // All loaded refs. This is used when declaring an onLoad
            //  method after some references have already been loaded
            db.loaded=[];
            // An array of changed references, together with the
            //  timestamp of the earliest change
            db.changes=[]; db.changed=false; 
            // Where to persist the data from this database
            db.storage=init.storage||false;
            // Whether _id fields for this database are globally unique
            db.absrefs=init.absrefs||false;
            // Whether _id fields for this database are OIDs (e.g. @xxx/xxx)
            db.oidrefs=init.oidrefs||false;
            // Handlers for loading refs from memory or network
            db.onload=[]; db.onloadnames={};
            // Rules to run when adding or dropping fields of references
            //  This doesn't happen on import, though.
            db.onadd={}; db.ondrop={}; 
            // This maps from field names to tables which map from
            //  keys to reference ids.
            db.indices={};}
        if (init.hasOwnProperty("absrefs")) db.absrefs=init.absrefs;
        if (init.aliases) {
            var aliases=init.aliases;
            var i=0, lim=aliases.length; while (i<lim) {
                var alias=aliases[i++];
                if (aliases[alias]) {
                    if (aliases[alias]!==db)
                        warn("Alias %s for %o already associated with %o",
                             alias,db,aliases[alias]);}
                else {
                    aliases[alias]=db;
                    db.aliases.push(alias);}}}
        if (init.onload) {
            var onload=init.onload;
            for (var methname in onload) {
                if (onload.hasOwnProperty(methname)) 
                    db.onLoad(onload[methname],methname);}}
        if (init.indices) {
            var index_specs=init.indices;
            var j=0, jlim=index_specs.length; while (j<jlim) {
                var ix=index_specs[j++];
                if (typeof ix !== "string") 
                    warn("Complex indices not yet handled!");
                else {
                    var index=db.indices[ix]=new ObjectMap();
                    index.fordb=db;}}}
        
        return db;}
    RefDB.prototype.name=RefDB.prototype.aliases=
        RefDB.prototype.refs=RefDB.prototype.altrefs=
        RefDB.prototype.allrefs=RefDB.prototype.loaded=
        RefDB.prototype.changes=RefDB.prototype.changed=
        RefDB.prototype.storage=RefDB.prototype.absrefs=
        RefDB.prototype.oidrefs=RefDB.prototype.onload=
        RefDB.prototype.onadd=RefDB.prototype.indices=
        RefDB.prototype.complete=false;

    var REFINDEX=RefDB.REFINDEX=2;
    var REFLOAD=RefDB.REFLOAD=4;
    var REFSTRINGS=RefDB.REFSTRINGS=8;
    var default_flags=((REFINDEX)|(REFSTRINGS));

    function checkAliases(aliases){
        var i=0, lim=aliases.length;
        while (i<lim) {
            var alias=aliases[i++];
            var db=refdbs[alias];
            if (db) return db;}
        return false;}

    RefDB.open=function RefDBOpen(name,DBClass){
        if (!(DBClass)) DBClass=RefDB;
        return ((refdbs.hasOwnProperty(name))&&(refdbs[name]))||
            ((aliases.hasOwnProperty(name))&&(aliases[name]))||
            (new DBClass(name));};
    function refDBProbe(name){
        return ((refdbs.hasOwnProperty(name))&&(refdbs[name]))||
            ((aliases.hasOwnProperty(name))&&(aliases[name]))||
            false;}
    RefDB.probe=refDBProbe;
    RefDB.prototype.addAlias=function DBaddAlias(alias){
        if (aliases[alias]) {
            if (aliases[alias]!==this) 
                warn("Alias %s for %o already associated with %o",
                     alias,this,aliases[alias]);}
        else {
            aliases[alias]=this;
            this.aliases.push(alias);}};

    RefDB.prototype.toString=function (){
        return "RefDB("+this.name+")";};

    RefDB.prototype.ref=function DBref(id){
        if (typeof id !== "string") {
            if (id instanceof Ref) return id;
            else throw new Error("Not a reference");}
        else if ((id[0]===":")&&(id[1]==="@")) id=id.slice(1);
        var refs=this.refs;
        return ((refs.hasOwnProperty(id))&&(refs[id]))||
            ((this.refclass)&&(new (this.refclass)(id,this)))||
            (new Ref(id,this));};
    RefDB.prototype.probe=function DBprobe(id){
        if (typeof id !== "string") {
            if (id instanceof Ref) return id;
            else return false;}
        else if ((id[0]===":")&&(id[1]==="@")) id=id.slice(1);
        var refs=this.refs;
        return ((refs.hasOwnProperty(id))&&(refs[id]));};
    RefDB.prototype.drop=function DBdrop(refset){
        var count=0;
        var refs=this.refs; var altrefs=this.altrefs;
        if (!(refset instanceof Array)) refset=[refset];
        var i=0, nrefs=refset.length; while (i<nrefs) {
            var ref=refset[i++]; var id;
            if (ref instanceof Ref) id=ref._id;
            else {id=ref; ref=this.probe(id);}
            if (!(ref)) continue; else count++;
            var aliases=ref.aliases;
            var pos=this.allrefs.indexOf(ref);
            if (pos>=0) this.allrefs.splice(pos,1);
            pos=this.changes.indexOf(ref);
            if (pos>=0) this.changes.splice(pos,1);
            pos=this.loaded.indexOf(ref);
            if (pos>=0) this.loaded.splice(pos,1);
            delete refs[id];
            if (this.storage instanceof Storage) {
                var storage=this.storage;
                var key="allids("+this.name+")";
                var allidsval=storage[key];
                var allids=((allidsval)&&(JSON.parse(allidsval)));
                var idpos=allids.indexOf(id);
                if (idpos>=0) {
                    allids.splice(idpos,1);
                    storage.setItem(key,JSON.stringify(allids));
                    storage.removeItem(id);}}
            if (aliases) {
                var j=0, jlim=aliases.length;
                while (j<jlim) {delete altrefs[aliases[j++]];}}}
        return count;};
    RefDB.prototype.clearOffline=function refDBclear(callback){
        if (!(this.storage)) return false;
        else if ((Storage)&&(this.storage instanceof Storage)) {
            var storage=this.storage;
            var key="allids("+this.name+")";
            var allids=this.storage[key];
            if (allids) allids=JSON.parse(allids);
            if (allids) {
                var i=0, lim=allids.length;
                while (i<lim) delete storage[allids[i++]];}
            delete storage[key];
            if (callback) setTimeout(callback,5);}
        else if (this.storage instanceof indexedDB) {
            // Not yet implemented
            return;}
        else return false;};

    RefDB.prototype.onLoad=function(method,name,noupdate){
        if ((name)&&(this.onloadnames[name])) {
            var cur=this.onloadnames[name];
            if (cur===method) return;
            var pos=this.onload.indexOf(cur);
            if (cur<0) {
                warn("Couldn't replace named onload method %s for <RefDB %s>",
                     name,this.name);
                return;}
            else {
                this.onload[pos]=method;}}
        else this.onload.push(method);
        if (name) this.onloadnames[name]=method;
        if (!(noupdate)) {
            var loaded=[].concat(this.loaded);
            fdjtAsync.slowmap(method,loaded);}};

    RefDB.prototype.onAdd=function(name,method){
        this.onadd[name]=method;};

    RefDB.prototype.onDrop=function(name,method){
        this.ondrop[name]=method;};
    
    var refpat=/^(((:|)@(([0-9a-fA-F]+\/[0-9a-fA-F]+)|(\/\w+\/.*)|(@\d+\/.*)))|((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})|((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}t[0-9a-zA-Z]+)|([^@]+@.+))$/;
    
    var getLocal=fdjtState.getLocal;

    function resolveRef(arg,db,DBType,force){
        if (typeof DBType !== "function") DBType=RefDB;
        if (!(arg)) return arg;
        else if (arg instanceof Ref) return arg;
        else if ((typeof arg === "object")&&(arg.id))
            return object2ref(arg,db);
        else if ((db)&&(db.refs.hasOwnProperty(arg)))
            return db.refs[arg];
        // The case above catches direct references inline; the
        // case below does a function call (probe) and catches
        // aliases
        else if ((db)&&(db.probe(arg))) return db.probe(arg);
        else if ((typeof arg === "string")&&(refpat.exec(arg))) {
            var at=arg.indexOf('@');
            if ((at===1)&&(arg[0]===':')) {arg=arg.slice(1); at=0;}
            if (at>0) {
                // this is the term@domain form
                var usedb=false, dbname=arg.slice(at+1), origin;
                if ((usedb=refDBProbe(dbname))) {}
                else if (refpat.exec(dbname)) {
                    origin=resolveRef(dbname);
                    if (origin) force=true;
                    else dbname=arg.slice(at+1);}
                else dbname=arg.slice(at+1);
                if ((db)&&(db.name===dbname)) usedb=db;
                else usedb=refDBProbe(dbname);
                arg=arg.slice(0,at);
                if (usedb) db=usedb;
                else if (force) {
                    warn("Creating forced RefDB domain %s for reference %s",dbname,arg);
                    db=RefDB.open(dbname,DBType);}
                else db=refDBProbe(dbname);
                if ((db)&&(origin)) {
                    db.origin=origin;
                    if (origin.name) db.fullname=origin.name;}
                arg=arg.slice(0,at);}
            else if (at<0) {
                var uuid;
                if (arg.search(":#U")===0) uuid=arg.slice(3);
                else if (arg.search("#U")===0) uuid=arg.slice(2);
                else if (arg.search("U")===0) uuid=arg.slice(1);
                else uuid=arg;
                var type=uuid.indexOf('t'), tail=arg.length-2;
                if (type>0) type="UUID"+uuid.slice(type); else type=false;
                if (tail>0) tail="-UUIDTYPE="+uuid.slice(tail);
                else tail=false;
                var known_db=((type)&&(refdbs[type]||aliases[type]))||
                    ((tail)&&(refdbs[tail]||aliases[tail]));
                if (known_db) db=known_db;
                else if ((force)&&(type)&&(DBType)) {
                    warn("Creating forced RefDB domain %s for reference %s",type,arg);
                    db=new DBType(type);
                    if (type) db.addAlias(type);}
                else {}}
            else if (arg[1]==='@') {
                // This is for local references
                var idstart=arg.indexOf('/');
                var atid=arg.slice(0,idstart);
                var atdb=aliases[atid];
                if (atdb) db=atdb;
                else {
                    var domain=getLocal(arg.slice(0,idstart),true);
                    if (domain) {
                        db=new RefDB(domain,{aliases: [atid]});}
                    else {
                        warn("Can't find domain for atid %s when resolving %s",atid,arg);
                        db=false;}}}
            else {
                var atprefix, slash;
                // Find the slash before the ID
                if (arg[1]==='/') {
                    slash=arg.slice(2).indexOf('/');
                    if (slash>0) slash=slash+2;}
                else slash=arg.indexOf('/');
                atprefix=arg.slice(at,slash+1);
                db=refdbs[atprefix]||aliases[atprefix]||
                    ((DBType)&&(new DBType(atprefix)));}}
        else {}
        if (!(db)) return false;
        if (db.refs.hasOwnProperty(arg)) return (db.refs[arg]);
        else if (force) return db.ref(arg);
        else return false;}
    RefDB.resolve=resolveRef;
    RefDB.ref=resolveRef;

    function Ref(id,db,instance){
        // Just called for the prototype
        if (arguments.length===0) return this;
        var at=id.indexOf('@');
        if ((at>1)&&(id[at-1]!=='\\')) {
            var domain=id.slice(at+1);
            if ((domain!==db.name)&&
                (db.aliases.indexOf(domain)<0))
                warn("Reference to %s being handled by %s",id,db);
            id=id.slice(0,at);}
        if (db.refs.hasOwnProperty(id)) return db.refs[id];
        else if (instance) {
            instance._id=id; instance._db=db;
            if (!(db.absrefs)) instance._domain=db.name;
            db.refs[id]=instance;
            db.allrefs.push(instance);
            return instance;}
        else if ((db.refclass)&&(!(this instanceof db.refclass)))
            return new (db.refclass)(id,db);
        else {
            this._id=id; this._db=db;
            if (!(db.absrefs)) this._domain=db.name;
            db.refs[id]=this;
            db.allrefs.push(this);
            return this;}}
    fdjt.Ref=RefDB.Ref=Ref;
    Ref.prototype._db=Ref.prototype._domain=
        Ref.prototype._qid=Ref.prototype._id=false;
    
    Ref.prototype.toString=function(){
        if (this._qid) return this._qid;
        else if (this._domain)
            return this._id+"@"+this._domain;
        else if (this._db.absrefs) return this._id;
        else return this._id+"@"+this._db.name;};
    Ref.prototype.getQID=function getQID(){
        var qid;
        if (this._qid) return this._qid;
        else if (this._domain) 
            qid=this._qid=(this._id+"@"+this._domain);
        else if (this._db.absrefs) 
            qid=this._qid=this._id;
        else {
            qid=this._qid=(this._id+"@"+this._db.name);}
        return qid;};

    Ref.prototype.addAlias=function addRefAlias(term){
        var refs=this._db.refs;
        if (refs.hasOwnProperty(term)) {
            if (refs[term]===this) return false;
            else throw {error: "Ref alias conflict"};}
        else if (this._db.altrefs.hasOwnProperty(term)) {
            if (this._db.altrefs[term]===this) return false;
            else throw {error: "Ref alias conflict"};}
        else {
            this._db.altrefs[term]=this;
            return true;}};

    function object2ref(value,db,dbtype) {
        var ref, dbref=false; 
        if (value._domain)
            dbref=RefDB.probe(value._domain)||(new RefDB(value._domain));
        if (dbref) ref=dbref.ref(value._id);
        else ref=RefDB.resolve(value._id,db,(dbtype||RefDB),true);
        return ref;}

    Ref.prototype.Import=function refImport(data,rules,flags){
        var db=this._db; var live=this._live;
        var indices=db.indices; var onload=db.onload;
        var onadd=((live)&&(db.onadd)), ondrop=((live)&&(db.ondrop));
        var aliases=data.aliases;
        if (typeof flags === "undefined") flags=default_flags;
        if (typeof rules === "undefined")
            rules=this.import_rules||db.import_rules;
        var indexing=(((flags)&(REFINDEX))!==0);
        var loading=(((flags)&(REFLOAD))!==0);
        var refstrings=(((flags)&(REFSTRINGS))!==0);
        if (aliases) {
            var ai=0, alim=aliases.length; while (ai<alim) {
                var alias=aliases[ai++];
                var cur=((db.refs.hasOwnProperty(alias))&&
                         (db.refs[alias]))||
                    ((db.altrefs.hasOwnProperty(alias))&&
                     (db.altrefs[alias]));
                if ((cur)&&(cur!==this))
                    warn("Ambiguous ref %s in %s refers to both %o and %o",
                         alias,db,cur.name,this.name);
                else aliases[alias]=this;}}
        var now=fdjtTime();
        if ((loading)&&(!(this._live))) this._live=now;
        for (var key in data) {
            if ((key==="aliases")||(key==="_id")) {}
            else if (data.hasOwnProperty(key)) {
                var value=data[key]; var rule=((rules)&&(rules[key]));
                if (typeof value !== "undefined") {
                    if (rule) value=(rule)(this,key,value,data,indexing);
                    value=importValue(value,db,refstrings);}
                var oldval=((live)&&(this[key]));
                this[key]=value;
                if (oldval) {
                    var drops=difference(oldval,value||[]);
                    var adds=((value)?(difference(value,oldval)):([]));
                    if ((indexing)&&(indices[key])) { 
                        if (adds.length)
                            this.indexRef(key,adds,indices[key],db);
                        if (drops.length)
                            this.dropIndexRef(key,drops,indices[key],db);}
                    if ((adds.length)&&(onadd[key])) {
                        var addfn=onadd[key];
                        var addi=0, addlen=adds.length;
                        while (addi<addlen) {
                            addfn(adds[addi++]);}}
                    if ((drops.length)&&(ondrop[key])) {
                        var dropfn=ondrop[key];
                        var dropi=0, droplen=drops.length;
                        while (dropi<droplen) {
                            dropfn(drops[dropi++]);}}}
                else if ((value)&&(indexing)&&(indices[key])) 
                    this.indexRef(key,value,indices[key],db);}}
        // These are run-once inits loaded on initial import
        if (loading) {
            // Run the db-specific inits for each reference
            if (onload) {
                var i=0, lim=onload.length; while (i<lim) {
                    var loadfn=onload[i++];
                    loadfn(this,now);}}
            // Run per-instance delayed inits
            if (this._onload) {
                var onloads=this._onload, inits=onloads.fns;
                var j=0, jlim=inits.length; while (j<jlim) {
                    inits[j++](this,now);}
                delete this._onload;}}
        // Record a change if we're not loading and not already changed.
        if ((!(loading))&&(!(this._changed))) {
            this._changed=now;
            db.changes.push(this);
            if (!(db.changed)) {
                db.changed=now; db.changes.push(db);}}};
    function importValue(value,db,refstrings){
        if ((typeof value === "undefined")||
            (typeof value === "number")||
            (value=== null))
            return value;
        else if (value instanceof Ref) return value;
        else if (value instanceof Array) {
            var i=0, lim=value.length; var copied=false;
            while (i<lim) {
                var v=value[i++], nv=v;
                if (v===null) nv=undefined;
                else if (v instanceof Ref) nv=v;
                else if ((typeof v === "object")&&(v._id)) {
                    var ref=object2ref(v,db);
                    if (ref) {
                        for (var slot in v) {
                            if ((v.hasOwnProperty(slot))&&
                                (slot!=="_id")&&(slot!=="_db"))
                                ref[slot]=importValue(v[slot],db,refstrings);}
                        nv=ref;}}
                else if ((refstrings)&&(typeof v === "string")&&
                         (refpat.exec(v))) {
                    nv=resolveRef(v,db)||v;}
                if (typeof nv === "undefined") {
                    if (!(copied)) copied=value.slice(0,i-1);}
                else if (copied) copied.push(nv);
                else if (nv!==v) {
                    copied=value.slice(0,i-1);
                    copied.push(nv);}
                else {}}
            if (copied) return copied; else return value;}
        else if ((typeof value === "object")&&(value._id)) {
            var refv=object2ref(value,db);
            for (var vslot in value) {
                if ((value.hasOwnProperty(vslot))&&
                    (vslot!=="_id")&&(vslot!=="_db"))
                    refv[vslot]=importValue(value[vslot],db,refstrings);}
            return refv;}
        else if ((refstrings)&&(typeof value === "string")&&
                 (refpat.exec(value)))
            return resolveRef(value,db)||value;
        else return value;}
    Ref.prototype.importValue=function(value,refstrings){
        return importValue(this._db,value,refstrings);};
    RefDB.prototype.importValue=function(val,refstrings){
        return importValue(val,this,refstrings);};
    function defImport(item,refs,db,rules,flags){
        var ref=resolveRef(item._id,item._domain||db,
                           db.constructor,true);
        if (!(ref)) warn("Couldn't resolve database for %o",item._id);
        else {
            refs.push(ref);
            ref.Import(item,rules||false,flags);}}

    RefDB.prototype.Import=function refDBImport(data,rules,flags,callback){
        var refs=[]; var db=this;
        if (!(data instanceof Array)) {
            defImport(data,refs,db,rules,flags);
            if (callback) {
                if (callback.call) 
                    setTimeout(function(){callback(refs[0]);});
                return refs[0];}
            else return refs[0];}
        if ((!(callback))||(data.length<=7)) {
            var i=0, lim=data.length; while (i<lim) {
                defImport(data[i++],refs,db,rules,flags);}
            if ((callback)&&(callback.call)) 
                setTimeout(function(){callback(refs);},10);
            return refs;}
        else if (!(callback.call))
            fdjtAsync.slowmap(function(item){
                defImport(item,refs,db,rules,flags);},data);
        else fdjtAsync.slowmap(function(item){
            defImport(item,refs,db,rules,flags);},
                               data,
                               {done: function(){callback(refs);}});};

    Ref.prototype.onLoad=function(fn,name){
        if (this._live) fn(this);
        else if (this._onload) {
            if (this._onload[name]) return;
            if (name) this._onload[name]=fn;
            this._onload.fns.push(fn);}
        else {
            this._onload={fns:[fn]};
            if (name) this._onload[name]=fn;}};
    
    Ref.Export=Ref.prototype.Export=function refExport(xforms){
        var db=this._id;
        var exported={_id: this._id};
        if (!(xforms)) xforms=this.export_rules||db.export_rules;
        if (!(db.absrefs)) this._domain=db.name;
        for (var key in this) {
            if (key[0]==="_") continue;
            else if (this.hasOwnProperty(key)) {
                var value=this[key];
                var xform=((xforms)&&(xforms[key]));
                if (xform) value=xform(value,key,exported);
                if (typeof value === "undefined") {}
                else if ((typeof value === "number")||
                         (typeof value === "string"))
                    exported[key]=value;
                else if (value instanceof Ref) {
                    if (value._db.absrefs)
                        exported[key]={_id: value._id};
                    else exported[key]={
                        _id: value._id,
                        _domain: value._domain||value._db.name};}
                else exported[key]=exportValue(value,this._db);}}
        return exported;};

    function exportValue(value,db){
        if (value instanceof Ref) {
            if (value._db===db) return {_id: value._id};
            else if (value._db.absrefs) return {_id: value._id};
            else return {
                _id: value._id,
                _domain: value._domain||value._db.name};}
        else if (value instanceof Array) {
            var i=0, lim=value.length; var exports=false;
            while (i<lim) {
                var elt=value[i++];
                var exported=exportValue(elt,db);
                if (elt!==exported) {
                    if (exports) exports.push(exported);
                    else {
                        exports=value.slice(0,i-1);
                        exports.push(exported);}}
                else if (exports) exports.push(elt);
                else {}}
            return exports||value;}
        else if (typeof value === "object") {
            var copied=false, fields=[];
            for (var field in value) {
                if (value.hasOwnProperty(field)) {
                    var fieldval=value[field];
                    var exportval=exportValue(fieldval,db);
                    if (fieldval!==exportval) {
                        if (!(copied)) {
                            copied={};
                            if (fields.length) {
                                var j=0, jlim=fields.length;
                                while (j<jlim) {
                                    var f=fields[j++];
                                    copied[f]=value[f];}}}
                        copied[field]=exportval;}
                    else if (copied) copied[field]=fieldval;
                    else fields.push(field);}}
            return copied||value;}
        else return value;}
    Ref.exportValue=exportValue;
    RefDB.prototype.exportValue=function(val){
        return exportValue(val,this);};
    
    RefDB.prototype.load=function loadRefs(refs,callback,args){
        function docallback(){
            if (callback) {
                if (args) callback.apply(null,args);
                else callback();}}
        function load_ref(arg,loaded,storage){
            var ref=arg, content;
            if (typeof ref === "string")
                ref=db.ref(ref,false,true);
            if (!(ref)) {
                warn("Couldn't resolve ref to %s",arg);
                return;}
            else if (ref._live) return;
            loaded.push(ref);
            if (absrefs) content=storage[ref._id];
            else if (atid)
                content=storage[atid+"("+ref._id+")"];
            else {
                if (db.atid) atid=db.atid;
                else atid=db.atid=getatid(storage,db);
                content=storage[atid+"("+ref._id+")"];}
            if (!(content))
                warn("No item stored for %s",ref._id);
            else ref.Import(
                JSON.parse(content),false,REFLOAD|REFINDEX);}
        if (!(this.storage)) return;
        else if (this.storage instanceof Storage) {
            if (!(refs)) refs=[].concat(this.allrefs);
            else if (refs===true) {
                var all=this.storage["allids("+this.name+")"];
                if (all) refs=JSON.parse(all).concat(this.allrefs);
                else refs=[].concat(this.allrefs);}
            else if (refs instanceof Ref) refs=[refs];
            else if (typeof refs === "string") refs=[refs];
            else if (typeof refs.length === "undefined") refs=[refs];
            else {}
            var storage=this.storage; var loaded=this.loaded;
            var db=this, absrefs=this.absrefs, refmap=this.refs;
            var atid=false; var needrefs=[];
            var i=0, lim=refs.length; while (i<lim) {
                var refid=refs[i++], ref=refid;
                if (typeof refid === "string") ref=refmap[refid];
                if (!((ref instanceof Ref)&&(ref._live)))
                    needrefs.push(refid);}
            if (needrefs.length) {
                var opts=((!(callback))?(false):
                          (args)?{done: docallback}:{done: callback});
                return fdjtAsync.slowmap(
                    function(arg){load_ref(arg,loaded,storage);},
                    needrefs,opts);}
            else {
                docallback();
                return new Promise(function(resolve){
                    resolve(refs);});}}
        else if (this.storage instanceof window.indexedDB) {
            // Not yet implemented
            return;}
        else {}};
    RefDB.prototype.load=function loadRefs(refs){
        if (this.storage instanceof Storage) 
            return this.loadFromStorage(refs);
        else return false;};
    RefDB.prototype.loadFromStorage=function loadFromStorage(refs){
        var db=this, storage=this.storage, loaded=this.loaded;
        var atid=(db.atid)||(db.atid=getatid(storage,db));
        var needrefs=[], refmap=db.refs, absrefs=db.absrefs;
        function storage_loader(arg,loaded){
            var ref=arg, content;
            if (typeof ref === "string") ref=db.ref(ref,false,true);
            if (!(ref)) {warn("Couldn't resolve ref to %s",arg); return;}
            else if (ref._live) return;
            else {}
            if (absrefs) content=storage[ref._id];
            else if (atid) content=storage[atid+"("+ref._id+")"];
            else content=storage[atid+"("+ref._id+")"];
            if (content) {
                loaded.push(ref);
                ref.Import(JSON.parse(content),false,REFLOAD|REFINDEX);}}
        if (!(refs)) refs=[].concat(db.allrefs);
        else if (refs===true) {
            var all=storage["allids("+db.name+")"]||"[]";
            refs=JSON.parse(all).concat(db.allrefs);}
        else if (!(Array.isArray(refs))) refs=[refs];
        else {}
        var i=0, lim=refs.length; while (i<lim) {
            var refid=refs[i++], ref=refid;
            if (typeof refid === "string") ref=refmap[refid];
            if (!((ref instanceof Ref)&&(ref._live)))
                needrefs.push(refid);}
        if (needrefs.length)
            return fdjtAsync.slowmap(
                function(arg){storage_loader(arg,loaded,storage);},
                needrefs);
        else return new Promise(function(resolve){
            var resolved=[]; var i=0, lim=refs.length;
            while (i<lim) {
                var refid=refs[i++];
                if (typeof ref==="string")
                    ref=refmap[refid]; else ref=refid;
                resolved.push(ref);}
            return resolve(resolved);});};

    RefDB.prototype.loadref=function loadRef(ref){
        if (typeof ref === "string") ref=this.ref(ref);
        return ref.load();};
    Ref.prototype.load=function loadRef() {
        var ref=this, db=this._db;
        function loadref(resolve){
            if (ref._live) return resolve(ref);
            else db.load(ref).then(function(){resolve(ref);});}
        return new Promise(loadref);};

    // This does a resolve and load for various refs
    RefDB.load=function RefDBload(spec,dbtype,callback,args){
        if (typeof spec === "string") {
            var ref=RefDB.resolve(spec,false,(dbtype||RefDB),true);
            if (ref) return ref.load(callback,args);
            else throw {error: "Couldn't resolve "+spec};}
        else if (spec instanceof Ref)
            return spec.load(callback,args);
        else if (spec instanceof Array) {
            var loads={}, dbs=[]; var i=0, lim=spec.length;
            while (i<lim) {
                var s=spec[i++]; var r=false;
                if (typeof s === "string")
                    r=RefDB.resolve(s,false,dbtype||RefDB,true);
                else if (s instanceof Ref) r=s;
                if (!(r)||(r._live)) continue;
                var db=r._db, name=db.name;
                if (loads[name]) loads[name].push(r);
                else {
                    loads[name]=[r];
                    dbs.push(db);}}
            i=0; lim=dbs.length; while (i<lim) {
                var loadfrom=dbs[i++];
                loadfrom.load(loads[loadfrom.name],args);}
            return loads;}
        else return false;};
    
    RefDB.prototype.saveToStorage=function(refs,updatechanges){
        var db=this, storage=this.storage;
        var atid=this.atid; var ids=[];
        function savingLocally(resolve){
            var i=0, lim=refs.length; while (i<lim) {
                var ref=refs[i++];
                if (typeof ref === "string") ref=db.ref(ref);
                if (!(ref._live)) continue;
                if ((ref._saved)&&(!(ref._changed))) continue;
                var exported=ref.Export();
                exported._saved=fdjtTime.tick();
                if (db.absrefs) {
                    ids.push(ref._id);
                    storage.setItem(ref._id,JSON.stringify(exported));}
                else {
                    if (atid) {}
                    else if (ref.atid) atid=ref.atid;
                    else atid=ref.atid=getatid(storage,ref);
                    var id=atid+"("+ref._id+")"; ids.push(id);
                    storage.setItem(id,JSON.stringify(exported));}
                ref._changed=false;}
            if (updatechanges) {
                var changes=db.changes, new_changes=[];
                var j=0, n_changed=changes.length;
                while (j<n_changed) {
                    var c=changes[j++];
                    if (c._changed) new_changes.push(c);}
                db.changes=new_changes;
                if (new_changes.length===0) {
                    db.changed=false;
                    var pos=changed_dbs.indexOf(db);
                    if (pos>=0) changed_dbs.splice(pos,1);}}
            var allids=storage["allids("+db.name+")"];
            if (allids) allids=JSON.parse(allids); else allids=[];
            var n=allids.length;
            allids=merge(allids,ids);
            if (allids.length!==n) 
                storage.setItem("allids("+db.name+")",
                                JSON.stringify(allids));
            if (resolve) fdjt.ASync(resolve);}
        return new Promise(savingLocally);};
    
    RefDB.prototype.save=function saveRefs(refs,updatechanges){
        var db=this, storage=this.storage;
        if (refs===true) refs=this.allrefs;
        else if (!(refs)) refs=this.changes;
        else {}
        function saving(resolve){
            if (db.storage instanceof Storage)
                db.saveToStorage(refs,updatechanges).then(function(){
                    db.changed=false;
                    db.changes=[];
                    var pos=changed_dbs.indexOf(db);
                    if (pos>=0) changed_dbs.splice(pos,1);
                    if (resolve) resolve();});
            else if (db.storage instanceof window.indexedDB) {}
            else return resolve();}
        if (!(storage)) return false;
        else return new Promise(saving);};
    Ref.prototype.save=function(){
        var ref=this, db=this._db;
        function saveref(resolve){
            if (!(ref._changed)) return resolve(ref);
            else return db.save([ref]).then(function(){
                resolve(ref);});}
        return new Promise(saveref);};

    function getatid(storage,db){
        if (db.atid) return db.atid;
        var atid=storage["atid("+db.name+")"];
        if (atid) {
            db.atid=atid;
            return atid;}
        else {
            var count=storage["atid.count"];
            if (!(count)) {
                atid=count=1; storage["atid.count"]="2";}
            else {
                count=parseInt(count,10);
                atid=db.atid="@@"+count;
                storage["atid("+db.name+")"]=atid;
                storage["atid.count"]=count+1;}
            return atid;}}
    
    function getKeyString(val,db){
        if (val instanceof Ref) {
            if (val._db===db) return "@"+val._id;
            else if (val._domain) return "@"+val._id+"@"+val._domain;
            else return "@"+val._id;}
        else if (typeof val === "number") 
            return "#"+val;
        else if (typeof val === "string")
            return "\""+val;
        else if (val.toJSON)
            return "{"+val.toJSON();
        else return "&"+val.toString();}
    RefDB.getKeyString=getKeyString;
    
    Ref.prototype.indexRef=function indexRef(key,val,index,db){
        var keystrings=[]; var rdb=this._db;
        var refstring=
            (((!(db))||(rdb===db)||(rdb.absrefs))?(this._id):
             ((this._qid)||((this.getQID)&&(this.getQID()))));
        if (!(db)) db=rdb;
        var indices=db.indices;
        if (!(index))
            index=((indices.hasOwnProperty(key))&&(indices[key]));
        if (!(index)) {
            warn("No index on %s for %o in %o",key,this,db);
            return false;}
        if (val instanceof Ref) {
            if (rdb===val._db) keystrings=["@"+val._id];
            else keystrings=["@"+(val._qid||val.getQID())];}
        else if (val instanceof Array) {
            db=this._db;
            var i=0, lim=val.length; while (i<lim) {
                var elt=val[i++];
                if (elt instanceof Ref)
                    keystrings.push("@"+(elt._qid||elt.getQID()));
                else if (typeof elt === "number") 
                    keystrings=["#"+elt];
                else if (typeof elt === "string")
                    keystrings=["\""+elt];
                else if (elt._qid)
                    keystrings.push("@"+(elt._qid||elt.getQID()));
                else if (elt.getQID)
                    keystrings.push("@"+(elt.getQID()));
                else {}}}
        else if (typeof val === "number") 
            keystrings=["#"+val];
        else if (typeof val === "string")
            keystrings=["\""+val];
        else keystrings=["?"+val.toString()];
        if (keystrings.length) {
            var j=0, jlim=keystrings.length; while (j<jlim) {
                var keystring=keystrings[j++];
                var refs=index[keystring];
                if (refs) refs.push(refstring);
                else index[keystring]=[refstring];}
            return keystrings.length;}
        else return false;};
    Ref.prototype.dropIndexRef=function dropIndexRef(key,val,index,db){
        if (!(db)) db=this._db;
        if (!(index)) index=db.indices[key];
        if (!(index)) return false;
        var keystrings=[];
        if (val instanceof Ref) {
            if (this._db===val._db) keystrings=["@"+val._id];
            else keystrings=["@"+(val._qid||val.getQID())];}
        else if (val instanceof Array) {
            var i=0, lim=val.length; while (i<lim) {
                var elt=val[i++];
                if (elt instanceof Ref) 
                    keystrings.push("@"+(elt._qid||elt.getQID()));
                else if (typeof elt === "number") 
                    keystrings=["#"+val];
                else if (typeof elt === "string")
                    keystrings=["\""+val];
                else if (elt._qid)
                    keystrings.push("@"+(elt._qid||elt.getQID()));
                else if (elt.getQID)
                    keystrings.push("@"+(elt.getQID()));
                else {}}}
        else if (typeof val === "number") 
            keystrings=["#"+val];
        else if (typeof val === "string")
            keystrings=["\""+val];
        else {}
        if (keystrings.length) {
            var deleted=0;
            var j=0, jlim=keystrings.length; while (j<jlim) {
                var keystring=keystrings[j++]; var refs=index[keystring];
                if (!(refs)) continue;
                var pos=refs.indexOf(this._id);
                if (pos<0) continue;
                else refs.splice(pos,1);
                if (refs.length===0) delete index[keystring];
                deleted++;}
            return deleted;}
        else return false;};

    RefDB.prototype.find=function findIDs(key,value){
        var index=this.indices[key];
        if (index) {
            var items=index.getItem(value,this);
            if (items) return setify(items);
            else return [];}
        else return [];};
    RefDB.prototype.findRefs=function findRefs(key,value){
        var index=this.indices[key];
        if (index) {
            var items=index.getItem(value,this), results=[];
            if (items) {
                var i=0, lim=items.length;
                while (i<lim) {
                    var item=items[i++];
                    if (!(item)) {}
                    else if (typeof item === "string") {
                        var ref=this.probe(item);
                        if (ref) results.push(ref);}
                    else results.push(item);}}
            return fdjtSet(results);}
        else return [];};
    RefDB.prototype.count=function countRefs(key,value){
        var index=this.indices[key];
        if (index) {
            var vals=index.getItem(value,this);
            return ((vals)?(vals.length||0):(0));}
        else return 0;};
    RefDB.prototype.addIndex=function addIndex(key,Constructor){
        if (!(Constructor)) Constructor=ObjectMap;
        if (!(this.indices.hasOwnProperty(key))) {
            var index=this.indices[key]=new Constructor();
            index.fordb=this;
            return index;}
        else return this.indices[key];};
    
    // Array utility functions
    function arr_contains(arr,val,start){
        return (arr.indexOf(val,start||0)>=0);}
    function arr_position(arr,val,start){
        return arr.indexOf(val,start||0);}

    var id_counter=1;

    /* Fast sets */
    function set_sortfn(a,b) {
        if (a===b) return 0;
        else if (typeof a === typeof b) {
            if (typeof a === "number")
                return a-b;
            else if (typeof a === "string") {
                if (a<b) return -1;
                else return 1;}
            else if (a._qid) {
                if (b._qid) {
                    if (a._qid<b._qid) return -1;
                    else return 1;}
                else return -1;}
            else if (b._qid) return 1;
            else if ((a._fdjtid)&&(b._fdjtid)) {
                if ((a._fdjtid)<(b._fdjtid)) return -1;
                else return 1;}
            else return 0;}
        else if (typeof a < typeof b) return -1;
        else return 1;}
    RefDB.compare=set_sortfn;

    function intersection(set1,set2){
        if (typeof set1 === 'string') set1=[set1];
        if (typeof set2 === 'string') set2=[set2];
        if ((!(set1))||(set1.length===0)) return [];
        if ((!(set2))||(set2.length===0)) return [];
        if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
        if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
        var results=[];
        var i=0; var j=0; var len1=set1.length; var len2=set2.length;
        var allstrings=set1._allstrings&&set2._allstrings;
        var new_allstrings=true;
        while ((i<len1) && (j<len2))
            if (set1[i]===set2[j]) {
                if ((new_allstrings)&&(typeof set1[i] !== 'string'))
                    new_allstrings=false;
                results.push(set1[i]);
                i++; j++;}
        else if ((allstrings)?
                 (set1[i]<set2[j]):
                 (set_sortfn(set1[i],set2[j])<0)) i++;
        else j++;
        results._allstrings=new_allstrings;
        results._sortlen=results.length;
        return results;}
    RefDB.intersection=intersection;

    function difference(set1,set2){
        if (typeof set1 === 'string') set1=[set1];
        if (typeof set2 === 'string') set2=[set2];
        if ((!(set1))||(set1.length===0)) return [];
        if ((!(set2))||(set2.length===0)) return set1;
        if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
        if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
        var results=[];
        var i=0; var j=0; var len1=set1.length; var len2=set2.length;
        var allstrings=set1._allstrings&&set2._allstrings;
        var new_allstrings=true;
        while ((i<len1) && (j<len2)) {
            if (set1[i]===set2[j]) {
                i++; j++;}
            else if ((allstrings)?
                     (set1[i]<set2[j]):
                     (set_sortfn(set1[i],set2[j])<0)) {
                if ((new_allstrings)&&(typeof set1[i] !== 'string'))
                    new_allstrings=false;
                results.push(set1[i]);
                i++;}
            else j++;}
        if ((!(new_allstrings))||(set1._allstrings)) 
            results=results.concat(set1.slice(i));
        else while (i<len1) {
            var elt=set1[i++];
            if ((new_allstrings)&&(typeof elt !== "string"))
                new_allstrings=false;
            results.push(elt);}
        results._allstrings=new_allstrings;
        results._sortlen=results.length;
        return results;}
    RefDB.difference=difference;
    
    function union(set1,set2){
        if (typeof set1 === 'string') set1=[set1];
        if (typeof set2 === 'string') set2=[set2];
        if ((!(set1))||(set1.length===0)) return set2;
        if ((!(set2))||(set2.length===0)) return set1;
        if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
        if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
        var results=[];
        var i=0; var j=0; var len1=set1.length; var len2=set2.length;
        var allstrings=set1._allstrings&&set2._allstrings;
        while ((i<len1) && (j<len2))
            if (set1[i]===set2[j]) {
                results.push(set1[i]); i++; j++;}
        else if ((allstrings)?
                 (set1[i]<set2[j]):
                 (set_sortfn(set1[i],set2[j])<0))
            results.push(set1[i++]);
        else results.push(set2[j++]);
        while (i<len1) results.push(set1[i++]);
        while (j<len2) results.push(set2[j++]);
        results._allstrings=allstrings;
        results._sortlen=results.length;
        return results;}
    RefDB.union=union;

    function merge(set1,set2){
        var merged=[]; merged._sortlen=0;
        if (!(set1 instanceof Array)) set1=[set1];
        if (!(set2 instanceof Array)) set2=[set2];
        if ((!(set1))||(set1.length===0)) {
            if ((!(set2))||(set2.length===0)) return merged;
            merged=merged.concat(set2);
            if (set2._sortlen) {
                merged._sortlen=set2._sortlen;
                merged._allstrings=set2._allstrings;
                return merged;}
            else return setify(merged);}
        else if ((!(set2))||(set2.length===0))
            return merge(set2,set1);
        if (set1._sortlen!==set1.length) set1=setify(set1);
        if (set2._sortlen!==set2.length) set2=setify(set2);
        var i=0; var j=0; var len1=set1.length; var len2=set2.length;
        var allstrings=set1._allstrings&&set2._allstrings;
        while ((i<len1) && (j<len2))
            if (set1[i]===set2[j]) {
                merged.push(set1[i]); i++; j++;}
        else if ((allstrings)?
                 (set1[i]<set2[j]):
                 (set_sortfn(set1[i],set2[j])<0))
            merged.push(set1[i++]);
        else merged.push(set2[j++]);
        while (i<len1) merged.push(set1[i++]);
        while (j<len2) merged.push(set2[j++]);
        merged._allstrings=allstrings;
        merged._sortlen=merged.length;
        return merged;}
    RefDB.merge=merge;

    function overlaps(set1,set2){
        if (typeof set1 === 'string') set1=[set1];
        if (typeof set2 === 'string') set2=[set2];
        if ((!(set1))||(set1.length===0)) return false;
        if ((!(set2))||(set2.length===0)) return false;
        if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
        if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
        var i=0; var j=0; var len1=set1.length; var len2=set2.length;
        var allstrings=set1._allstrings&&set2._allstrings;
        while ((i<len1) && (j<len2))
            if (set1[i]===set2[j]) return true;
        else if ((allstrings)?
                 (set1[i]<set2[j]):
                 (set_sortfn(set1[i],set2[j])<0)) i++;
        else j++;
        return false;}
    RefDB.overlaps=overlaps;

    /* Sets */
    /* sets are really arrays that are sorted to simplify
       set operations.  the ._sortlen property tells how
       much of the array is sorted */
    function fdjtSet(arg){
        var result=[]; result._sortlen=0;
        if (arguments.length===0) return result;
        else if (arguments.length===1) {
            if (!(arg)) return result;
            else if (arg instanceof Array) {
                if ((!(arg.length))||(arg._sortlen===arg.length))
                    return arg;
                else if (typeof arg._sortlen === "number")
                    return setify(arg);
                else return setify([].concat(arg));}
            else {
                result=[arg]; 
                if (typeof arg === 'string') result._allstrings=true;
                result._sortlen=1;
                return result;}}
        else {
            var i=0, lim=arguments.length; result=[];
            while (i<lim) {
                var each_arg=arguments[i++];
                if (!(each_arg)) {}
                else if (each_arg instanceof Array)
                    result=result.concat(each_arg);
                else result.push(each_arg);}
            return setify(result);}}
    RefDB.Set=fdjtSet;
    fdjt.Set=fdjtSet;
    RefDB.toSet=fdjtSet;

    function setify(array) {
        var len;
        if (array._sortlen===(len=array.length)) return array;
        // else if ((array._sortlen)&&(array._sortlen>1))
        else if (len===0) {
            array._sortlen=0;
            return array;}
        else if (len===1) {
            var elt1=array[0];
            array._sortlen=1;
            array._allstrings=(typeof elt1 === 'string');
            if (typeof elt1 === "object") {
                if ((elt1._qid)||(elt1._fdjtid)) {}
                else if (elt1.getQID) elt1._qid=elt1.getQID();
                else elt1._fdjtid=++id_counter;}
            return array;}
        else {
            var allstrings=true;
            var i=0, lim=array.length;
            while (i<lim) {
                var elt=array[i++];
                if ((allstrings)&&(typeof elt !== 'string')) {
                    allstrings=false;
                    if (typeof elt === "object") {
                        if ((elt._qid)||(elt._fdjtid)) {}
                        else if (elt.getQID) elt._qid=elt.getQID();
                        else elt._fdjtid=++id_counter;}}}
            array._allstrings=allstrings;
            if (lim===1) return array;
            if (allstrings) array.sort();
            else array.sort(set_sortfn);
            // Now remove duplicates
            var read=1; var write=1; var readlim=array.length;
            var cur=array[0];
            while (read<readlim) {
                if (array[read]!==cur) {
                    array[write++]=cur=array[read++];}
                else read++;}
            array._sortlen=array.length=write;
            return array;}}
    
    function set_add(set,val) {
        if (val instanceof Array) {
            var changed=false;
            for (var elt in val) 
                if (set_add(set,elt)) changed=true;
            return changed;}
        else if (set.indexOf) {
            var pos=set.indexOf(val);
            if (pos>=0) return false;
            else set.push(val);
            return true;}
        else {
            var i=0; var lim=set.length;
            while (i<lim)
                if (set[i]===val) return false; else i++;
            if (typeof val !== 'string') set._allstrings=false;
            set.push(val);
            return true;}}
    
    function set_drop(set,val) {
        if (val instanceof Array) {
            var changed=false;
            for (var elt in val)
                if (set_drop(set,elt)) changed=true;
            return changed;}
        else if (set.indexOf) {
            var pos=set.indexOf(val);
            if (pos<0) return false;
            else set.splice(pos,1);
            return true;}
        else {
            var i=0; var lim=set.length;
            while (i<lim)
                if (set[i]===val) {
                    set.splice(i,1);
                    return true;}
            else i++;
            return false;}}
    
    /* Refs */

    Ref.prototype.get=function refGet(prop){
        if (this.hasOwnProperty(prop)) return this[prop];
        else if (this._live) return false;
        else return undefined;};
    Ref.prototype.getSet=function refGetSet(prop){
        if (this.hasOwnProperty(prop)) {
            var val=this[prop];
            if (val instanceof Array) {
                if (val._sortlen===val.length) return val;
                else return setify(val);}
            else return setify([val]);}
        else if (this._live) return [];
        else return undefined;};
    Ref.prototype.getArray=function refGetArray(prop){
        if (this.hasOwnProperty(prop)) {
            var val=this[prop];
            if (val instanceof Array) return val;
            else return [val];}
        else if (this._live) return [];
        else return undefined;};
    Ref.prototype.getValue=function refGet(prop){
        var ref=this; function getting(resolve,reject){
            if (ref.hasOwnProperty(prop))
                return resolve(ref[prop]);
            else if (ref._live) return resolve(undefined);
            else if (ref._db.storage)
                return ref.load().then(function(r){
                    return resolve(r[prop]);})
                .catch(reject);
            else return resolve(undefined);}
        return new Promise(getting);};
    function setCall(fn,val){
        if (Array.isArray(val)) {
            if ((val._sortlen)&&(val._sortlen===val.length))
                return fn(val);
            else return fn(setify(val));}
        else return fn([val]);}
    Ref.prototype.getValues=function refGet(prop){
        var ref=this;
        function getting(resolve,reject){
            ref.getValue(prop).then(function(val){
                return setCall(resolve,val);})
                .catch(reject);}
        return new Promise(getting);};

    Ref.prototype.add=function refAdd(prop,val,index){
        var ref=this, db=this._db;
        function handle_add(resolved){
            if ((val instanceof Array)&&
                (typeof val._sortlen === "number")) {
                var i=0, lim=val.length; while (i<lim) {
                    ref.add(prop,val[i++],index);}}
            else if (prop==="aliases") {
                if ((db.refs[val]===ref)||
                    (db.altrefs[val]===ref))
                    return ((resolved)&&(resolved(false)));
                else {
                    db.altrefs[val]=ref;
                    if (ref.aliases) ref.aliases.push(val);
                    else ref.aliases=[val];
                    return (resolved)&&(resolved(true));}}
            else if (ref.hasOwnProperty(prop)) {
                var cur=ref[prop];
                if (cur===val)
                    return (resolved)&&(resolved(false));
                else if (cur instanceof Array) {
                    if (!(set_add(cur,val)))
                        return (resolved)&&(resolved(false));
                    else {}}
                else ref[prop]=fdjtSet([cur,val]);}
            else if ((val instanceof Array)&&
                     (typeof val._sortlen !== "number"))
                ref[prop]=fdjtSet([val]);
            else ref[prop]=val;
            // If we've gotten through to here, we've made a change,
            //  so we update the change structures, run any add methods
            //  and index if appropriate
            if (!(ref._changed)) {
                var now=fdjtTime();
                if (!(db.changed)) changed_dbs.push(db);
                db.changed=now;
                ref._changed=now;
                db.changes.push(ref);}
            if (db.onadd.hasOwnProperty(prop))
                (db.onadd[prop])(ref,prop,val);
            if ((index)&&(db.indices[prop]))
                ref.indexRef(prop,ref[prop],db.indices[prop]);
            if (resolved) resolved(true);}
        function add_onload(){handle_add(false);}
        if (typeof index === "undefined") {
            if (db.indices.hasOwnProperty(prop)) index=true;
            else index=false;}
        else if ((index)&&(!(db.indices.hasOwnProperty(prop)))) {
            // fdjtLog("Creating index on %s for %o",prop,db);
            db.addIndex(prop);}
        else {}
        if ((val instanceof Array)&&(val._sortlen===0))
            return new Promise(function(resolve){return resolve(false);});
        else if ((!(this._live))&&(this._db.storage)) {
            if (this._onload) this._onload.push(add_onload);
            else this._onload=[add_onload];
            return this.load();}
        else return new Promise(handle_add);};
    Ref.prototype.drop=function refDrop(prop,val,dropindex){
        var ref=this, db=this._db;
        function handle_drop(resolved){
            if (ref.hasOwnProperty(prop)) {
                var cur=ref[prop];
                if (cur===val) delete ref[prop];
                else if (cur instanceof Array) {
                    if (!(set_drop(cur,val)))
                        return (resolved)&&(resolved(false));
                    if (cur.length===0) delete ref[prop];}
                else return (resolved)&&(resolved(false));}
            else return (resolved)&&(resolved(false));
            if (db.ondrop.hasOwnProperty(prop)) 
                (db.ondrop[prop])(ref,prop,val);
            if (!(ref._changed)) {
                var now=fdjtTime();
                if (db.changed) {db.changed=now; changed_dbs.push(db);}
                ref._changed=now;
                db.changes.push(ref);}
            if ((dropindex)&&(db.indices[prop])) 
                ref.indexRefDrop(prop,db.indices[prop]);
            return (resolved)&&(resolved(true));}
        function drop_onload(){handle_drop(false);}
        if (typeof dropindex === "undefined") dropindex=true;
        if (prop==='_id')
            return new Promise(function(resolved){resolved(false);});
        else if ((!(this._live))&&(this._db.storage)) {
            if (this._onload) this._onload.push(drop_onload);
            else this._onload=[drop_onload];
            return this.load();}
        else return new Promise(handle_drop);};
    Ref.prototype.test=function(prop,val){
        if (this.hasOwnProperty(prop)) {
            if (typeof val === 'undefined') return true;
            var cur=this[prop];
            if (cur===val) return true;
            else if (cur instanceof Array) {
                if (arr_contains(cur,val)) return true;
                else if (this._live) return false;
                else return undefined;}
            else if (this._live) return false;
            else return undefined;}
        else if (this._live) return false;
        else return undefined;};
    Ref.prototype.store=function(prop,val){
        var toadd=[], todrop=[];
        if (this.hasOwnProperty(prop)) {
            var cur=this[prop];
            if (cur===val) return false;
            else {
                toadd=difference(val,cur);
                todrop=difference(cur,val);}}
        else if (val instanceof Array)
            toadd=val;
        else toadd=[val];
        var i=0, lim=todrop.length;
        while (i<lim) this.drop(prop,todrop[i++]);
        i=0; lim=toadd.length; while (i<lim) this.add(prop,toadd[i++]);
        return true;};

    Ref.prototype.toHTML=function(){
        var dom=false;
        return ((this._db.forHTML)&&(this._db.forHTML(this)))||
            ((this._db.forDOM)&&(dom=this._db.forDOM(this))&&
             (dom.outerHTML))||
            this._id||this.oid||this.uuid;};
    Ref.prototype.toDOM=function(){
        return ((this._db.forDOM)&&(this._db.forDOM(this)))||
            ((this._db.forHTML)&&(fdjtDOM(this._db.forHTML(this))))||
            (fdjtDOM("span.fdjtref",this._id||this.oid||this.uuid));};

    /* Maps */

    function ObjectMap() {return this;}
    ObjectMap.prototype.get=function ObjectMapGet(key) {
        var keystring=getKeyString(key,this.fordb);
        if (this.hasOwnProperty(keystring))
            return this[keystring];
        else if (typeof key === "string")
            // This is helpful for debugging
            return this[key]||this["@"+key];
        else return undefined;};
    ObjectMap.prototype.getItem=ObjectMap.prototype.get;
    ObjectMap.prototype.set=function(key,val) {
        var keystring=getKeyString(key,this.fordb);
        if (val instanceof Array)
            this[keystring]=[val];
        else this[keystring]=val;};
    ObjectMap.prototype.setItem=ObjectMap.prototype.set;
    ObjectMap.prototype.increment=function(key,delta) {
        var keystring=getKeyString(key,this.fordb);
        var cur=this[keystring], next;
        if (cur) this[keystring]=next=cur+delta;
        else this[keystring]=next=delta;
        return next;};
    ObjectMap.prototype.add=function(key,val) {
        var keystring=getKeyString(key,this.fordb);
        if (this.hasOwnProperty(keystring)) {
            var cur=this[keystring];
            if (cur===val) return false;
            else if (cur instanceof Array) {
                if (arr_contains(cur,val)) return false;
                else {cur.push(val); return true;}}
            else if (val instanceof Array) {
                this[keystring]=setify([cur,val]);
                return true;}
            else {
                this[keystring]=setify([cur,val]);
                return true;}}
        else if (val instanceof Array) 
            this[keystring]=setify([val]);
        else this[keystring]=val;};
    ObjectMap.prototype.drop=function(key,val) {
        var keystring=getKeyString(key,this.fordb);
        if (this.hasOwnProperty(keystring)) {
            var cur=this[keystring];
            if (cur===val) {
                delete this[keystring];
                return true;}
            else if (cur instanceof Array) {
                var pos=cur.indexOf(val);
                if (pos<0) return false;
                cur.splice(pos,1); if (cur._sortlen) cur._sortlen--;
                if (cur.length===1) {
                    if (!(cur[0] instanceof Array))
                        this[keystring]=cur[0];}
                return true;}
            else return false;}
        else return false;};
    fdjt.Map=ObjectMap;
    RefDB.ObjectMap=ObjectMap;
    RefDB.fdjtMap=ObjectMap;

    function StringMap() {return this;}
    StringMap.prototype.get=function StringMapGet(keystring) {
        if (typeof keystring !== "string") return undefined;
        if (this.hasOwnProperty(keystring))
            return this[keystring];
        else return undefined;};
    StringMap.prototype.getItem=StringMap.prototype.get;
    StringMap.prototype.set=function(keystring,val) {
        if (typeof keystring !== "string") return;
        if (val instanceof Array)
            this[keystring]=[val];
        else this[keystring]=val;};
    StringMap.prototype.setItem=StringMap.prototype.set;
    StringMap.prototype.increment=function(keystring,delta) {
        if (typeof keystring !== "string") return;
        var cur=this[keystring], next;
        if (cur) this[keystring]=next=cur+delta;
        else this[keystring]=next=delta;
        return next;};
    StringMap.prototype.add=function(keystring,val) {
        if (typeof keystring !== "string") return;
        if (this.hasOwnProperty(keystring)) {
            var cur=this[keystring];
            if (cur===val) return false;
            else if (cur instanceof Array) {
                if (arr_contains(cur,val)) return false;
                else {cur.push(val); return true;}}
            else if (val instanceof Array) {
                this[keystring]=setify([cur,val]);
                return true;}
            else {
                this[keystring]=setify([cur,val]);
                return true;}}
        else if (val instanceof Array) 
            this[keystring]=setify([val]);
        else this[keystring]=val;};
    StringMap.prototype.drop=function(keystring,val) {
        if (typeof keystring !== "string") return;
        if (this.hasOwnProperty(keystring)) {
            var cur=this[keystring];
            if (cur===val) {
                delete this[keystring];
                return true;}
            else if (cur instanceof Array) {
                var pos=cur.indexOf(val);
                if (pos<0) return false;
                cur.splice(pos,1); if (cur._sortlen) cur._sortlen--;
                if (cur.length===1) {
                    if (!(cur[0] instanceof Array))
                        this[keystring]=cur[0];}
                return true;}
            else return false;}
        else return false;};
    fdjt.StringMap=StringMap;
    RefDB.StringMap=StringMap;

    function RefMap(db) {this._db=db; return this;}
    RefMap.prototype.get=function RefMapGet(key){
        if (typeof key === "string") {
            if (this.hasOwnProperty(key)) return this[key];
            else return undefined;}
        else if (key instanceof Ref) {
            var id=((this.uniqueids)&&key._id)||key._qid||key.getQID();
            return this[id];}
        else return undefined;};
    RefMap.prototype.set=function RefMapSet(key,val){
        if (typeof key === "string") this[key]=val;
        else if (key instanceof Ref) {
            var id=key._qid||((this.uniqueid)&&key._id)||key.getQID();
            this[id]=val;}
        else return false;};
    RefMap.prototype.increment=function RefMapIncrement(key,delta){
        if (typeof key === "string") {
            if (this.hasOwnProperty(key))
                this[key]=this[key]+delta;
            else this[key]=delta;}
        else if (key instanceof Ref) {
            var id=key._qid||((this.uniqueids)&&key._id)||key.getQID();
            this[id]=(this[id]||0)+delta;}
        else return false;};
    fdjt.RefMap=RefDB.RefMap=RefMap;
    
    /* Miscellaneous array and table functions */

    RefDB.add=function refDBAdd(obj,field,val,nodup){
        if (arguments.length===2)
            return set_add(obj,field);
        else if (obj instanceof Ref)
            return obj.add.apply(obj,arguments);
        else if (nodup) 
            if (obj.hasOwnProperty(field)) {
                var vals=obj[field];
                if (!(arr_contains(vals,val))) obj[field].push(val);
                else {}}
        else obj[field]=new Array(val);
        else if (obj.hasOwnProperty(field))
            obj[field].push(val);
        else obj[field]=new Array(val);
        if ((obj._all) && (!(arr_contains(obj._all,field))))
            obj._all.push(field);};

    RefDB.drop=function refDBDrop(obj,field,val){
        if (arguments.length===2)
            return set_drop(obj,field);
        else if (obj instanceof Ref)
            return obj.drop.apply(obj,arguments);
        else if (!(val))
            /* Drop all vals */
            obj[field]=[];
        else if (obj.hasOwnProperty(field)) {
            var vals=obj[field];
            var pos=arr_position(vals,val);
            if (pos<0) return;
            else vals.splice(pos,1);}
        else {}};

    RefDB.test=function refDBTest(obj,field,val){
        if (arguments.length===2)
            return arr_contains(obj,field);
        else if (obj instanceof Ref)
            return obj.test.apply(obj,arguments);
        else if (typeof val === "undefined")
            return (((obj.hasOwnProperty) ?
                     (obj.hasOwnProperty(field)) : (obj[field])) &&
                    ((obj[field].length)>0));
        else if (obj.hasOwnProperty(field)) { 
            if (arr_position(obj[field],val)<0)
                return false;
            else return true;}
        else return false;};

    RefDB.insert=function RefDBInsert(array,value){
        if (arr_position(array,value)<0) array.push(value);};

    RefDB.remove=function RefDBInsert(array,value,count){
        var pos=arr_position(array,value);
        if (pos<0) return array;
        array.splice(pos,1);
        if (count) {
            count--;
            while ((count>0) &&
                   ((pos=arr_position(array,value,pos))>=0)) {
                array.splice(pos,1); count--;}}
        return array;};

    RefDB.indexOf=function RefDBIndexOf(array,elt,pos){
        if (pos) return array.indexOf(elt,pos);
        else return array.indexOf(elt);};

    RefDB.contains=arr_contains;
    RefDB.position=arr_position;

    function countKeys(obj){
        var count=0; for (var key in obj) {
            if (obj.hasOwnProperty(key)) count++;}
        return count;}
    RefDB.countKeys=countKeys;
    function localKeys(obj){
        var keys=[]; for (var key in obj) {
            if (obj.hasOwnProperty(key)) keys.push(key);}
        return keys;}
    RefDB.localKeys=localKeys;

    function Query(dbs,clauses,weights){
        if (arguments.length===0) return this;
        if (dbs) this.dbs=dbs;
        if (clauses) {
            if (clauses instanceof Array)
                this.clauses=clauses;
            else this.clauses=[clauses];}
        if (weights) this.weights=weights;
        // Figure out if references can be unique IDs
        var i=0, n_dbs=dbs.length;
        if (n_dbs>1) while (i<n_dbs) {
            if (!(dbs[i].absrefs)) return this;
            else i++;}
        this.uniqueids=true;
        return this;}
    RefDB.Query=Query;
    Query.prototype.uniqueids=false;
    
    function sortbyweight(f1,f2){return f2.weight-f1.weight;}

    Query.prototype.execute=function executeQuery(){
        if (this.scores) return this;
        var dbs=this.dbs;
        var clauses=this.clauses;
        if (!((dbs)&&(dbs.length))) {
            var empty_result=this.results=fdjtSet();
            warn("No dbs for query %o!",this);
            return empty_result;}
        else if (!((clauses)&&(clauses.length))) {
            var full_result=fdjtSet();
            var i=0, lim=dbs.length;
            while (i<lim) full_result=
                merge(full_result,setify(dbs[i++].allrefs));
            this.results=full_result;
            return full_result;}
        var query_weights=this._weights||this.weights;
        var uniqueids=((dbs.length===1)||(this.uniqueids));
        var scores=new RefMap();
        var counts=new RefMap();
        var matches=fdjtSet();
        var match_seen={};
        // This makes these go faster because they don't bother
        // disambiguting _id fields.
        counts.uniqueids=scores.uniqueids=uniqueids;
        var i_clause=0, n_clauses=clauses.length;
        while (i_clause<n_clauses) {
            var clause=clauses[i_clause++];
            var fields=clause.fields;
            var values=clause.values;
            var clause_weights=clause.weights;
            var findings=[];
            if (!(fields instanceof Array)) fields=[fields];
            if (!(values instanceof Array)) values=[values];
            var i_field=0; var n_fields=fields.length;
            while (i_field<n_fields) {
                var field=fields[i_field++];
                var weight=((clause_weights)&&(clause_weights[field]))||
                    ((query_weights)&&(query_weights[field]))||
                    (this.default_weight)||1;
                var i_value=0, n_values=values.length;
                while (i_value<n_values) {
                    var value=values[i_value++];
                    var i_db=0, n_dbs=dbs.length;
                    while (i_db<n_dbs) {
                        var db=dbs[i_db++];
                        var hits=db.find(field,value);
                        if ((hits)&&(hits.length)) {
                            findings.push({
                                field: field, hits: setify(hits),
                                weight: weight, value: value,
                                db: db});}}}}
            // Sort so the highest scoring findings go first
            findings.sort(sortbyweight);
            var finding_i=0, n_findings=findings.length; var seen={};
            while (finding_i<n_findings) {
                var finding=findings[finding_i++];
                var hit_ids=finding.hits, fdb=finding.db, abs=fdb.absrefs;
                var i_hit=0, n_hits=hit_ids.length, hit_id, ref;
                if ((uniqueids)||(abs)) while (i_hit<n_hits) {
                    hit_id=hit_ids[i_hit++];
                    if (seen[hit_id]) continue;
                    else seen[hit_id]=hit_id;
                    if (!(match_seen[hit_id])) {
                        matches.push(fdb.ref(hit_id));
                        match_seen[hit_id]=hit_id;}
                    counts[hit_id]=(counts[hit_id]||0)+1;
                    scores[hit_id]=(scores[hit_id]||0)+finding.weight;}
                else {
                    hit_id=hit_ids[i_hit++]; ref=fdb.ref(hit_id);
                    var fullid=ref._qid||((abs)&&(ref._id))||ref.getQID();
                    if (seen[fullid]) continue;
                    else seen[fullid]=fullid;
                    if (!(match_seen[fullid])) {
                        matches.push(ref);
                        match_seen[fullid]=fullid;}
                    counts[fullid]=(counts[fullid]||0)+1;
                    scores[fullid]=(scores[fullid]||0)+finding.weight;}}}
        if (n_clauses>1) {
            var results=this.results=[];
            var new_scores=new RefMap(), new_counts=new RefMap();
            var i_matches=0, n_matches=matches.length;
            while (i_matches<n_matches) {
                var match=matches[i_matches++];
                var count=counts.get(match);
                // If there are more than two clauses, score the union
                // of their pair-wise intersections (count>=2).
                if (count>=2) {
                    var score=scores.get(match);
                    new_scores.set(match,score);
                    new_counts.set(match,count);
                    results.push(match);}}
            results._allstrings=false;
            results._sortlen=results.length;
            this.results=results;
            this.scores=new_scores;
            this.counts=new_counts;}
        else {
            this.results=setify(matches);
            this.scores=scores;
            this.counts=counts;}
        
        return this;};

    /* Indexed DB utilities */
    
    function useIndexedDB(dbname,version,init,opts){
        if ((version)&&(!opts)&&
            (typeof version !== "number")&&(version.version)) {
            opts=version; version=opts.version;}
        else if (!(opts)) opts={};
        if (!(init)) init=opts.init||false;
        if (!(version)) version=1;
        var trace=opts.trace;
        var vname=dbname+":"+version;
        function usingIndexedDB(resolve,reject){
            if ((typeof indexedDB === "undefined")||
                (!(indexedDB.open))) {
                fdjtLog.warn(
                    "No indexedDB implementation for opening %:",vname);
                if (reject)
                    reject(new Error("No indexedDB implementation"));
                else throw new Error("No indexedDB implementation");}
            try {
                var req=indexedDB.open(dbname,version), fail=false;
                var init_timeout=setTimeout(function(){
                    fail=true;
                    fdjtLog.warn("Init timeout for indexedDB %s",vname);
                    reject(new Error("Init timeout"));},
                                            opts.timeout||15000);
                req.onerror=function(event){
                    fail=true;
                    warn("Error initializing indexedDB: %o",
                         event.errorCode);
                    if (init_timeout) clearTimeout(init_timeout);
                    if (reject) return reject(event);
                    else return event;};
                req.onsuccess=function(evt) {
                    if (fail) {
                        fdjtLog("Discarding indexedDB %s after failure!",
                                vname);
                        return;}
                    var db=evt.target.result;
                    if (init_timeout) clearTimeout(init_timeout);
                    if (trace)
                        fdjtLog("Got existing IndexedDB %s %o",
                                vname,db);
                    if (resolve) return resolve(db);
                    else return db;};
                req.onupgradeneeded=function(evt) {
                    var db=evt.target.result;
                    if (!(init)) return resolve(db);
                    else {
                        req.onsuccess=function(){
                            if (resolve) return resolve(db);
                            else return db;};
                        req.onerror=function(evt){
                            fdjtLog("Error upgrading %s %o",vname,evt);
                            if (reject) reject(evt);
                            else throw new Error(
                                "Error upgrading %s",vname);};
                        if (init.call) {
                            try {init(db);
                                 if (resolve) return resolve(db);
                                 else return db;}
                            catch (ex) {
                                fdjtLog("Error upgrading %s:%d: %o",
                                        dbname,version,ex);
                                if (reject) reject(ex);}}
                        else if (reject) reject(
                            new Error("Bad indexDB init: %o",init));
                        else throw new Error("Bad indexDB init: %o",init);}
                    return db;};}
            catch (ex) {
                fdjtLog("usingIndexedDB failed: %o",ex);
                if (reject) reject(ex);}}
        return new Promise(usingIndexedDB);}
    RefDB.useIndexedDB=useIndexedDB;

    return RefDB;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
