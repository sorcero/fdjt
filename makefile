# This is the makefile for generating combination files
# from the individual fdjt files.

ECHO=/bin/echo
CLEAN=/bin/rm -f
PATH:=/usr/local/bin:${PATH}
FDJT_FILES=header.js \
	promise.js async.js fetch.js \
	charnames.js string.js time.js template.js hash.js \
	syze.js iscroll.js \
	log.js init.js state.js dom.js adjustfont.js \
	json.js refdb.js ajax.js wsn.js textindex.js \
	ui.js showpage.js dialog.js completions.js taphold.js selecting.js \
	scrollever.js \
	globals.js
# idbshim.hint iscroll.hint hash.hint
FDJT_HINTS=promise.hint async.hint fetch.hint time.hint init.hint syze.hint \
	charnames.hint string.hint log.hint refdb.hint \
	state.hint dom.hint json.hint ajax.hint adjustfont.hint \
	wsn.hint template.hint textindex.hint codexlayout.hint \
	dialog.hint ui.hint showpage.hint completions.hint \
	taphold.hint selecting.hint \
	scrollever.hint
BUILDUUID:=`uuidgen`
BUILDTIME:=`date`
BUILDHOST:=`hostname`

%.hint: %.js
	@echo Checking fdjt/$@
	@JSHINT=`which jshint`;      \
	if test "x$${JSHINT}" = "x"; \
	   then touch $@;            \
	else $${JSHINT} $^ | tee $@; \
	fi

all: fdjt.js fdjt.hints

buildstamp.js: $(FDJT_FILES) fdjt.css codexlayout.css langs.css misc.css
	@$(ECHO) "// FDJT build information" > buildstamp.js
	@$(ECHO) "fdjt.revision='"`git describe`"';" >> buildstamp.js
	@$(ECHO) "fdjt.buildhost='${BUILDHOST}';" >> buildstamp.js
	@$(ECHO) "fdjt.buildtime='"${BUILDTIME}"';" >> buildstamp.js
	@$(ECHO) "fdjt.builduuid='"${BUILDUUID}"';" >> buildstamp.js 
	@$(ECHO) >> buildstamp.js

fdjt.js: $(FDJT_FILES) buildstamp.js
	@cat $(FDJT_FILES) buildstamp.js > $@
fdjt.hints: $(FDJT_HINTS) buildstamp.js
	@cat $(FDJT_HINTS) > $@
TAGS: $(FDJT_FILES) codexlayout.js
	@etags -o $@ $^
ext/underscore.js: ext/underscore/underscore.js
	@cp -p ext/underscore/underscore.js ext/underscore.js
ext/sizzle.js: ext/sizzle/sizzle.js
	@cp -p ext/sizzle/sizzle.js ext/sizzle.js
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

