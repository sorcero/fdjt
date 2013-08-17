# This is the makefile for generating combination files
# from the individual fdjt files.

ECHO=/bin/echo
CLEAN=/bin/rm -f
FDJT_FILES=header.js string.js time.js \
	syze.js iscroll.js indexed.js \
	log.js init.js state.js dom.js \
	json.js refdb.js ajax.js \
	hash.js wsn.js template.js \
	ui.js completions.js taphold.js selecting.js \
	adjustfont.js scrollever.js \
	globals.js
FDJT_HINTS=string.hint time.hint \
	syze.hint iscroll.hint indexed.hint \
	log.hint init.hint state.hint dom.hint \
	refdb.hint json.hint ajax.hint \
	hash.hint wsn.hint template.hint \
	ui.hint completions.hint taphold.hint selecting.hint \
	adjustfont.hint scrollever.hint
BUILDUUID:=`uuidgen`
BUILDTIME:=`date`
BUILDHOST:=`hostname`

%.hint: %.js
	@JSHINT=`which jshint`; if test "x$${JSHINT}" = "x"; then touch $@; else $${JSHINT} $^ | tee $@; fi

all: fdjt.js fdjt.hints

buildstamp.js: $(FDJT_FILES) fdjt.css codexlayout.css langs.css misc.css
	$(ECHO) "// FDJT build information" > buildstamp.js
	$(ECHO) "var fdjt_revision='"`git describe`"';" >> buildstamp.js
	$(ECHO) "var fdjt_buildhost='${BUILDHOST}';" >> buildstamp.js
	$(ECHO) "var fdjt_buildtime='"${BUILDTIME}"';" >> buildstamp.js
	$(ECHO) "var fdjt_builduuid='"${BUILDUUID}"';" >> buildstamp.js 
	$(ECHO) >> buildstamp.js

fdjt.js: $(FDJT_FILES) buildstamp.js
	cat buildstamp.js $(FDJT_FILES) > $@
fdjt.hints: $(FDJT_HINTS) buildstamp.js
	cat $(FDJT_HINTS) > $@
TAGS: $(FDJT_FILES) codexlayout.js
	etags -o $@ $^
ext/underscore.js: ext/underscore/underscore.js
	cp -p ext/underscore/underscore.js ext/underscore.js
ext/sizzle.js: ext/sizzle/sizzle.js
	cp -p ext/sizzle/sizzle.js ext/sizzle.js
ext/augment/dist/augment-0.2.1.js ext/underscore/underscore.js ext/sizzle/sizzle.js:
	git submodule init
	git submodule update

clean: 
	$(CLEAN) fdjt.js buildstamp.js *.hint

fresh:
	make clean
	make all

publish:
	s3commit --exclude="*.svgz"
	s3commit --exclude="*.(js|css|png|gif)" --add-header=Content-encoding:gzip

