(function(e) {
    function t(t) {
        for (var r, o, i = t[0], c = t[1], l = t[2], m = 0, d = []; m < i.length; m++) o = i[m], Object.prototype.hasOwnProperty.call(n, o) && n[o] && d.push(n[o][0]), n[o] = 0;
        for (r in c) Object.prototype.hasOwnProperty.call(c, r) && (e[r] = c[r]);
        u && u(t);
        while (d.length) d.shift()();
        return a.push.apply(a, l || []), s()
    }

    function s() {
        for (var e, t = 0; t < a.length; t++) {
            for (var s = a[t], r = !0, i = 1; i < s.length; i++) {
                var c = s[i];
                0 !== n[c] && (r = !1)
            }
            r && (a.splice(t--, 1), e = o(o.s = s[0]))
        }
        return e
    }
    var r = {},
        n = {
            app: 0
        },
        a = [];

    function o(t) {
        if (r[t]) return r[t].exports;
        var s = r[t] = {
            i: t,
            l: !1,
            exports: {}
        };
        return e[t].call(s.exports, s, s.exports, o), s.l = !0, s.exports
    }
    o.m = e, o.c = r, o.d = function(e, t, s) {
        o.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: s
        })
    }, o.r = function(e) {
        "undefined" !== typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, o.t = function(e, t) {
        if (1 & t && (e = o(e)), 8 & t) return e;
        if (4 & t && "object" === typeof e && e && e.__esModule) return e;
        var s = Object.create(null);
        if (o.r(s), Object.defineProperty(s, "default", {
                enumerable: !0,
                value: e
            }), 2 & t && "string" != typeof e)
            for (var r in e) o.d(s, r, function(t) {
                return e[t]
            }.bind(null, r));
        return s
    }, o.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e["default"]
        } : function() {
            return e
        };
        return o.d(t, "a", t), t
    }, o.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, o.p = "/";
    var i = window["webpackJsonp"] = window["webpackJsonp"] || [],
        c = i.push.bind(i);
    i.push = t, i = i.slice();
    for (var l = 0; l < i.length; l++) t(i[l]);
    var u = c;
    a.push([0, "chunk-vendors"]), s()
})({
    0: function(e, t, s) {
        e.exports = s("cd49")
    },
    "0073": function(e, t, s) {},
    "09f6": function(e, t, s) {
        "use strict";
        s("86d1")
    },
    "0ce7": function(e, t, s) {},
    "0faf": function(e, t, s) {},
    1863: function(e, t, s) {},
    1878: function(e, t, s) {
        "use strict";
        s("72c4")
    },
    2870: function(e, t, s) {},
    2914: function(e, t, s) {},
    "2a1a": function(e, t, s) {
        "use strict";
        s("ebf5")
    },
    "2e6b": function(e, t, s) {},
    3167: function(e, t, s) {
        "use strict";
        s("ec25")
    },
    "36a0": function(e, t, s) {},
    "3b50": function(e, t, s) {},
    "3ea4": function(e, t, s) {
        "use strict";
        s("441d")
    },
    "410c": function(e, t, s) {},
    "441d": function(e, t, s) {},
    "464e": function(e, t, s) {},
    4678: function(e, t, s) {
        var r = {
            "./af": "2bfb",
            "./af.js": "2bfb",
            "./ar": "8e73",
            "./ar-dz": "a356",
            "./ar-dz.js": "a356",
            "./ar-kw": "423e",
            "./ar-kw.js": "423e",
            "./ar-ly": "1cfd",
            "./ar-ly.js": "1cfd",
            "./ar-ma": "0a84",
            "./ar-ma.js": "0a84",
            "./ar-sa": "8230",
            "./ar-sa.js": "8230",
            "./ar-tn": "6d83",
            "./ar-tn.js": "6d83",
            "./ar.js": "8e73",
            "./az": "485c",
            "./az.js": "485c",
            "./be": "1fc1",
            "./be.js": "1fc1",
            "./bg": "84aa",
            "./bg.js": "84aa",
            "./bm": "a7fa",
            "./bm.js": "a7fa",
            "./bn": "9043",
            "./bn-bd": "9686",
            "./bn-bd.js": "9686",
            "./bn.js": "9043",
            "./bo": "d26a",
            "./bo.js": "d26a",
            "./br": "6887",
            "./br.js": "6887",
            "./bs": "2554",
            "./bs.js": "2554",
            "./ca": "d716",
            "./ca.js": "d716",
            "./cs": "3c0d",
            "./cs.js": "3c0d",
            "./cv": "03ec",
            "./cv.js": "03ec",
            "./cy": "9797",
            "./cy.js": "9797",
            "./da": "0f14",
            "./da.js": "0f14",
            "./de": "b469",
            "./de-at": "b3eb",
            "./de-at.js": "b3eb",
            "./de-ch": "bb71",
            "./de-ch.js": "bb71",
            "./de.js": "b469",
            "./dv": "598a",
            "./dv.js": "598a",
            "./el": "8d47",
            "./el.js": "8d47",
            "./en-au": "0e6b",
            "./en-au.js": "0e6b",
            "./en-ca": "3886",
            "./en-ca.js": "3886",
            "./en-gb": "39a6",
            "./en-gb.js": "39a6",
            "./en-ie": "e1d3",
            "./en-ie.js": "e1d3",
            "./en-il": "7333",
            "./en-il.js": "7333",
            "./en-in": "ec2e",
            "./en-in.js": "ec2e",
            "./en-nz": "6f50",
            "./en-nz.js": "6f50",
            "./en-sg": "b7e9",
            "./en-sg.js": "b7e9",
            "./eo": "65db",
            "./eo.js": "65db",
            "./es": "898b",
            "./es-do": "0a3c",
            "./es-do.js": "0a3c",
            "./es-mx": "b5b7",
            "./es-mx.js": "b5b7",
            "./es-us": "55c9",
            "./es-us.js": "55c9",
            "./es.js": "898b",
            "./et": "ec18",
            "./et.js": "ec18",
            "./eu": "0ff2",
            "./eu.js": "0ff2",
            "./fa": "8df4",
            "./fa.js": "8df4",
            "./fi": "81e9",
            "./fi.js": "81e9",
            "./fil": "d69a",
            "./fil.js": "d69a",
            "./fo": "0721",
            "./fo.js": "0721",
            "./fr": "9f26",
            "./fr-ca": "d9f8",
            "./fr-ca.js": "d9f8",
            "./fr-ch": "0e49",
            "./fr-ch.js": "0e49",
            "./fr.js": "9f26",
            "./fy": "7118",
            "./fy.js": "7118",
            "./ga": "5120",
            "./ga.js": "5120",
            "./gd": "f6b4",
            "./gd.js": "f6b4",
            "./gl": "8840",
            "./gl.js": "8840",
            "./gom-deva": "aaf2",
            "./gom-deva.js": "aaf2",
            "./gom-latn": "0caa",
            "./gom-latn.js": "0caa",
            "./gu": "e0c5",
            "./gu.js": "e0c5",
            "./he": "c7aa",
            "./he.js": "c7aa",
            "./hi": "dc4d",
            "./hi.js": "dc4d",
            "./hr": "4ba9",
            "./hr.js": "4ba9",
            "./hu": "5b14",
            "./hu.js": "5b14",
            "./hy-am": "d6b6",
            "./hy-am.js": "d6b6",
            "./id": "5038",
            "./id.js": "5038",
            "./is": "0558",
            "./is.js": "0558",
            "./it": "6e98",
            "./it-ch": "6f12",
            "./it-ch.js": "6f12",
            "./it.js": "6e98",
            "./ja": "079e",
            "./ja.js": "079e",
            "./jv": "b540",
            "./jv.js": "b540",
            "./ka": "201b",
            "./ka.js": "201b",
            "./kk": "6d79",
            "./kk.js": "6d79",
            "./km": "e81d",
            "./km.js": "e81d",
            "./kn": "3e92",
            "./kn.js": "3e92",
            "./ko": "22f8",
            "./ko.js": "22f8",
            "./ku": "2421",
            "./ku.js": "2421",
            "./ky": "9609",
            "./ky.js": "9609",
            "./lb": "440c",
            "./lb.js": "440c",
            "./lo": "b29d",
            "./lo.js": "b29d",
            "./lt": "26f9",
            "./lt.js": "26f9",
            "./lv": "b97c",
            "./lv.js": "b97c",
            "./me": "293c",
            "./me.js": "293c",
            "./mi": "688b",
            "./mi.js": "688b",
            "./mk": "6909",
            "./mk.js": "6909",
            "./ml": "02fb",
            "./ml.js": "02fb",
            "./mn": "958b",
            "./mn.js": "958b",
            "./mr": "39bd",
            "./mr.js": "39bd",
            "./ms": "ebe4",
            "./ms-my": "6403",
            "./ms-my.js": "6403",
            "./ms.js": "ebe4",
            "./mt": "1b45",
            "./mt.js": "1b45",
            "./my": "8689",
            "./my.js": "8689",
            "./nb": "6ce3",
            "./nb.js": "6ce3",
            "./ne": "3a39",
            "./ne.js": "3a39",
            "./nl": "facd",
            "./nl-be": "db29",
            "./nl-be.js": "db29",
            "./nl.js": "facd",
            "./nn": "b84c",
            "./nn.js": "b84c",
            "./oc-lnc": "167b",
            "./oc-lnc.js": "167b",
            "./pa-in": "f3ff",
            "./pa-in.js": "f3ff",
            "./pl": "8d57",
            "./pl.js": "8d57",
            "./pt": "f260",
            "./pt-br": "d2d4",
            "./pt-br.js": "d2d4",
            "./pt.js": "f260",
            "./ro": "972c",
            "./ro.js": "972c",
            "./ru": "957c",
            "./ru.js": "957c",
            "./sd": "6784",
            "./sd.js": "6784",
            "./se": "ffff",
            "./se.js": "ffff",
            "./si": "eda5",
            "./si.js": "eda5",
            "./sk": "7be6",
            "./sk.js": "7be6",
            "./sl": "8155",
            "./sl.js": "8155",
            "./sq": "c8f3",
            "./sq.js": "c8f3",
            "./sr": "cf1e",
            "./sr-cyrl": "13e9",
            "./sr-cyrl.js": "13e9",
            "./sr.js": "cf1e",
            "./ss": "52bd",
            "./ss.js": "52bd",
            "./sv": "5fbd",
            "./sv.js": "5fbd",
            "./sw": "74dc",
            "./sw.js": "74dc",
            "./ta": "3de5",
            "./ta.js": "3de5",
            "./te": "5cbb",
            "./te.js": "5cbb",
            "./tet": "576c",
            "./tet.js": "576c",
            "./tg": "3b1b",
            "./tg.js": "3b1b",
            "./th": "10e8",
            "./th.js": "10e8",
            "./tk": "5aff",
            "./tk.js": "5aff",
            "./tl-ph": "0f38",
            "./tl-ph.js": "0f38",
            "./tlh": "cf75",
            "./tlh.js": "cf75",
            "./tr": "0e81",
            "./tr.js": "0e81",
            "./tzl": "cf51",
            "./tzl.js": "cf51",
            "./tzm": "c109",
            "./tzm-latn": "b53d",
            "./tzm-latn.js": "b53d",
            "./tzm.js": "c109",
            "./ug-cn": "6117",
            "./ug-cn.js": "6117",
            "./uk": "ada2",
            "./uk.js": "ada2",
            "./ur": "5294",
            "./ur.js": "5294",
            "./uz": "2e8c",
            "./uz-latn": "010e",
            "./uz-latn.js": "010e",
            "./uz.js": "2e8c",
            "./vi": "2921",
            "./vi.js": "2921",
            "./x-pseudo": "fd7e",
            "./x-pseudo.js": "fd7e",
            "./yo": "7f33",
            "./yo.js": "7f33",
            "./zh-cn": "5c3a",
            "./zh-cn.js": "5c3a",
            "./zh-hk": "49ab",
            "./zh-hk.js": "49ab",
            "./zh-mo": "3a6c",
            "./zh-mo.js": "3a6c",
            "./zh-tw": "90ea",
            "./zh-tw.js": "90ea"
        };

        function n(e) {
            var t = a(e);
            return s(t)
        }

        function a(e) {
            if (!s.o(r, e)) {
                var t = new Error("Cannot find module '" + e + "'");
                throw t.code = "MODULE_NOT_FOUND", t
            }
            return r[e]
        }
        n.keys = function() {
            return Object.keys(r)
        }, n.resolve = a, e.exports = n, n.id = "4678"
    },
    "47ee": function(e, t, s) {},
    "4ac8": function(e, t, s) {},
    "4d90": function(e, t, s) {
        "use strict";
        s("3b50")
    },
    "56b3": function(e, t, s) {
        "use strict";
        s("f143")
    },
    "5b65": function(e, t, s) {},
    "5c48": function(e, t, s) {
        "use strict";
        s("410c")
    },
    "5ef0": function(e, t, s) {
        "use strict";
        s("5b65")
    },
    "62aa": function(e, t, s) {},
    "6c3e": function(e, t, s) {
        "use strict";
        s("2e6b")
    },
    "6e67": function(e, t, s) {
        "use strict";
        s("93a4")
    },
    "72c4": function(e, t, s) {},
    "7eab": function(e, t, s) {},
    "7faf": function(e, t, s) {
        "use strict";
        s("b8ff")
    },
    8127: function(e, t, s) {
        "use strict";
        s("9970")
    },
    "833c": function(e, t, s) {},
    8513: function(e, t, s) {
        "use strict";
        s("2914")
    },
    "86d1": function(e, t, s) {},
    8980: function(e, t, s) {
        e.exports = s.p + "img/dish_missing.8a2c1840.png"
    },
    "8ff3": function(e, t, s) {
        "use strict";
        s("0ce7")
    },
    "902d": function(e, t, s) {},
    "91f5": function(e, t, s) {
        "use strict";
        s("62aa")
    },
    "928d": function(e, t, s) {},
    "93a4": function(e, t, s) {},
    9970: function(e, t, s) {},
    a274: function(e, t) {
        e.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAATCAYAAAB7u5a2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAAgxJREFUeNq01F9ojnEUB/DPXtO2MFlMIjJ/2hSpKTdbKTfbcrOUcqEkuXDhRrlQlt6QK7kWFygrZUU8uTKh/GnJLKVIc4ELeWNq72sbr5vz1OP1yAX71a/zO9/n/M45z/md76mrVqvSNdDX4l9WMSkZ6GspYCuq9f7/WohhvCrMgvO1aEAyG85XhRyuO9a7qBM78ANNKGAC02hGWrpy7Cw2iQrmYy6+owcbsKke63E8jCuYCgdQxbeQTRmsHHJeJuOvEaARj/CugGfxcRBtWIk7gfVEDdfgTAZri30+sINYjd7QnxSTUqUe43iJzfgQH9+HvB9ZCpta7E3Ip/iExaGPQqGYlMp4gA70oyvzKDtD78KWHGxjYNtD34eZ1Hn6MA+xH0M1L385pxvysJOZ8yheiM6QKriJbtwLfU/o3TiXgw0Gdjg6DsaLSamSzXwMH7EsSvQ28GuZ+nbgQA3Wjd24nsl8JD0UYiZMRvadUe8lmcvLI2h7BluK1uiYNPCRlDyp8+xsuYtteJ3BkyBTts9v5/T5UPT4ZzzOc34lLtUH8xqCVK3xh7UMLeNLkGYKCzBWTEozqcO6nJHbjqNB6Vu48IcZ0oizEXwEp4pJ6ReD2pHbghtYF3p/0Ppqjd0cXMSujF0BJ7JGeVOxOSdg7SpgxV/u/ea8hL0xBiZw6Q+kmcYhPA+7BKdrjX4OAFxgjSdhyRmpAAAAAElFTkSuQmCC"
    },
    a369: function(e, t, s) {},
    a88b: function(e, t, s) {
        "use strict";
        s("902d")
    },
    aaed: function(e, t, s) {},
    b115: function(e, t, s) {
        "use strict";
        s("bf54")
    },
    b7df: function(e, t, s) {
        "use strict";
        s("aaed")
    },
    b8ff: function(e, t, s) {},
    bf54: function(e, t, s) {},
    c26f: function(e, t, s) {
        "use strict";
        s("d464")
    },
    c3a5: function(e, t, s) {
        "use strict";
        s("0073")
    },
    c41e: function(e, t, s) {
        "use strict";
        s("47ee")
    },
    ca0f: function(e, t, s) {
        "use strict";
        s("ed87")
    },
    cb66: function(e, t, s) {
        "use strict";
        s("7eab")
    },
    cd49: function(e, t, s) {
        "use strict";
        s.r(t);
        s("e260"), s("e6cf"), s("cca6"), s("a79d");
        var r = s("9ab4"),
            n = (s("fa6d"), s("41e6"), s("f9e3"), s("2dd8"), s("f2fd"), s("a369"), s("1863"), s("2b0e")),
            a = s("b85c"),
            o = (s("96cf"), s("1da1")),
            i = s("5f34"),
            c = s("55d9"),
            l = (s("d3b7"), s("53ca")),
            u = window.CefCallback,
            m = !0,
            d = {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: !1
            };
        m && console.table(u);
        var p = 'padding: 0 5px; color: #5b9e5b; font: 1rem/1.2 "Segoe UI"',
            f = 'padding: 0 3px; color: #31a5fb; font: 1rem/1.2 "Segoe UI"',
            v = 'padding: 0 3px; color: #ff0000; font: 1rem/1.2 "Segoe UI"';

        function g(e, t) {
            return h.apply(this, arguments)
        }

        function h() {
            return h = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                var r;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            return r = new Promise(function() {
                                var e = Object(o["a"])(regeneratorRuntime.mark((function e(r, n) {
                                    var a;
                                    return regeneratorRuntime.wrap((function(e) {
                                        while (1) switch (e.prev = e.next) {
                                            case 0:
                                                if (!t) {
                                                    e.next = 8;
                                                    break
                                                }
                                                return a = t, "object" === Object(l["a"])(t) && (a = JSON.stringify(t)), e.next = 5, u[s](r, n, a);
                                            case 5:
                                                m && (console.groupCollapsed("%c%s", p, "callCef." + s + " - " + (new Date).toLocaleString("ru-RU", d)), console.groupEnd()), e.next = 11;
                                                break;
                                            case 8:
                                                return e.next = 10, u[s](r, n);
                                            case 10:
                                                m && console.log("%c%s", f, "callCef." + s + " - " + (new Date).toLocaleString("ru-RU", d));
                                            case 11:
                                            case "end":
                                                return e.stop()
                                        }
                                    }), e)
                                })));
                                return function(t, s) {
                                    return e.apply(this, arguments)
                                }
                            }()), e.abrupt("return", r.then((function(e) {
                                var t = e ? JSON.parse(e) : null;
                                return m && (console.groupCollapsed("%c%s", p, "response-OK - " + (new Date).toLocaleString("ru-RU", d)), console.log(t), console.groupEnd()), t
                            })).catch((function(e) {
                                return e = JSON.parse(e), e.error = !0, console.group("%c%s", v, "response-error"), console.error("callCef." + s), console.error(e.code + " - " + e.desc), console.groupEnd(), e
                            })));
                        case 2:
                        case "end":
                            return e.stop()
                    }
                }), e)
            }))), h.apply(this, arguments)
        }
        var b = {
                sysInfo: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                dealerLogin: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                getDealerObjects: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                getMaxDate: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                generateLicense: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                getAllGsLicenses: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                getAllGsMasterLicenses: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                initGsLicense: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                deleteLicense: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(null, e));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                sendDefaultScenario: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(null, e));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                addVote: function(e, t) {
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    return s.abrupt("return", g(e, t));
                                case 1:
                                case "end":
                                    return s.stop()
                            }
                        }), s)
                    })))()
                },
                getVotesForPeriod: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getVotesForPeriod"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                getLocaleList: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "locales"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getLocaleData: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getLocaleData"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            w = {
                getRefs: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getLocalRefs"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getList: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getSettings"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                set: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "setSettings"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                checkXmlConnection: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "checkXmlConnection"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                getMonitorsList: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getMonitors"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getCashStations: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getCashStations"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getFonts: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getFonts"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getDateFormats: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "dateFormats"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                importRequest: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "import"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                importFile: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "importFile"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                exportSettings: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "exportSettings"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                importSettingsTemplate: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "importSettingsTemplate"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                importTheme: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "importTheme"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                startWatcher: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "startWatcher"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                stopWatcher: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "stopWatcher"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                checkWatcher: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "isWatcherStarted"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                }
            },
            _ = {
                setScreens: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "setScreens"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                getScreensList: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getScreens"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getScreen: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getScreen"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            x = {
                getList: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getSkins"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                get: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getSkin"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                update: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "setSkin"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                destroy: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "deleteSkin"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            y = {
                get: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getConditionSet"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                set: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "setConditionSet"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                destroy: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "deleteConditionSet"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            C = {
                getList: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getScenarios"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                get: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getScenario"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                set: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "setScenario"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                destroy: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "deleteScenario"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                changeConditionSetOrder: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "changeConditionSetOrder"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            k = {
                getList: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getScenes"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                get: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getScene"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                set: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "setScene"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                destroy: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "deleteScene"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            S = {
                getMedia: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getMedia"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                uploadMedia: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "uploadMedia"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                uploadFormData: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "uploadFormData"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            $ = {
                getMenu: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return e = e || null, t.abrupt("return", g(e, "getMenu"));
                                case 2:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                getDishCategories: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getDishCategories"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getPeriods: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getPeriods"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getRestaurants: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "getRestaurants"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getMenuWithPrices: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getMenuWithPrices"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                getModifiersWithPrices: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.abrupt("return", g(e, "getModifiersWithPrices"));
                                case 1:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            R = {
                start: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "startDemo"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                stop: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", g(null, "stopDemo"));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                }
            };

        function j(e) {
            return T.apply(this, arguments)
        }

        function T() {
            return T = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                var s;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            return t || (t = localStorage.language ? localStorage.language : "ru"), localStorage.language = t, e.next = 4, O(["en", t]);
                        case 4:
                            return s = e.sent, e.next = 7, i["a"].init({
                                lng: t,
                                fallbackLng: "en",
                                resources: s
                            });
                        case 7:
                        case "end":
                            return e.stop()
                    }
                }), e)
            }))), T.apply(this, arguments)
        }

        function O(e) {
            return P.apply(this, arguments)
        }

        function P() {
            return P = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                var s, r, n, o, i;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            s = {}, r = Object(a["a"])(t), e.prev = 2, r.s();
                        case 4:
                            if ((n = r.n()).done) {
                                e.next = 12;
                                break
                            }
                            return o = n.value, i = {}, e.next = 9, b.getLocaleData(o).then((function(e) {
                                e && (i = JSON.parse(e))
                            }));
                        case 9:
                            s[o] = {
                                translation: i
                            };
                        case 10:
                            e.next = 4;
                            break;
                        case 12:
                            e.next = 17;
                            break;
                        case 14:
                            e.prev = 14, e.t0 = e["catch"](2), r.e(e.t0);
                        case 17:
                            return e.prev = 17, r.f(), e.finish(17);
                        case 20:
                            return e.abrupt("return", s);
                        case 21:
                        case "end":
                            return e.stop()
                    }
                }), e, null, [
                    [2, 14, 17, 20]
                ])
            }))), P.apply(this, arguments)
        }
        n["default"].use(c["a"]), j().then();
        var N, L = new c["a"](i["a"]),
            D = {
                change: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, j(e);
                                case 2:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                }
            },
            F = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    attrs: {
                        id: "app"
                    }
                }, [s("transition", {
                    attrs: {
                        name: "fade2",
                        mode: "out-in"
                    }
                }, [s("router-view")], 1)], 1)
            },
            z = [],
            M = {
                name: "App",
                components: {},
                data: function() {
                    return {}
                },
                created: function() {
                    R.stop(), this.$store.commit("toggleDemo", !1)
                }
            },
            A = M,
            I = (s("7faf"), s("2877")),
            E = Object(I["a"])(A, F, z, !1, null, null, null),
            B = E.exports,
            H = s("8c4f"),
            V = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "unselectable",
                    attrs: {
                        id: "screen-wrapp"
                    }
                }, [s("span", {
                    domProps: {
                        innerHTML: e._s(e.defaultFont.importFont)
                    }
                }), e.skin.length < 1 ? s("div", {
                    staticClass: "screen-coming-soon"
                }, [s("div", {
                    staticClass: "center-title"
                }, [e.modeType ? s("span", [e._v(e._s(e.modeType))]) : s("span", [e._v("r_keeper"), s("i", [e._v("_GuestScreen")])])])]) : e._e(), e._l(e.skin, (function(t) {
                    return s("div", {
                        directives: [{
                            name: "show",
                            rawName: "v-show",
                            value: e.isShangeMode,
                            expression: "isShangeMode"
                        }],
                        key: t.id,
                        class: {
                            "empty-block": !t.scene
                        },
                        style: {
                            "font-family": e.defaultFont.style,
                            position: "absolute",
                            overflow: "hidden",
                            height: t.height + "px",
                            left: t.left + "px",
                            top: t.top + "px",
                            width: t.width + "px"
                        },
                        attrs: {
                            id: t.id
                        }
                    }, [t.scene ? "image" === t.scene.type ? s("image-scene", {
                        attrs: {
                            options: t.scene
                        }
                    }) : "dishImage" === t.scene.type ? s("dish-image-scene", {
                        attrs: {
                            options: t.scene
                        }
                    }) : "imageText" === t.scene.type ? s("image-text-scene", {
                        attrs: {
                            options: t.scene,
                            orders: e.orders
                        }
                    }) : "text" === t.scene.type ? s("text-scene", {
                        attrs: {
                            options: t.scene
                        }
                    }) : "video" === t.scene.type ? s("video-scene", {
                        attrs: {
                            options: t.scene
                        }
                    }) : "check" === t.scene.type ? s("check-scene", {
                        attrs: {
                            options: t.scene,
                            orders: e.orders
                        }
                    }) : "custom" === t.scene.type ? s("custom-scene", {
                        attrs: {
                            options: t.scene
                        }
                    }) : "gallery" === t.scene.type ? s("gallery-scene", {
                        attrs: {
                            options: t.scene
                        }
                    }) : "display" === t.scene.type ? s("display-scene", {
                        attrs: {
                            options: t.scene,
                            orders: e.orders,
                            "mode-type": e.modeType
                        }
                    }) : "qrCode" === t.scene.type ? s("qr-code-scene", {
                        attrs: {
                            options: t.scene,
                            orders: e.orders
                        }
                    }) : "qualityService" === t.scene.type ? s("quality-service-scene", {
                        attrs: {
                            options: t.scene,
                            orders: e.orders
                        }
                    }) : e._e() : s("div", {
                        staticClass: "empty"
                    })], 1)
                })), s("div", {
                    staticClass: "to-setting",
                    on: {
                        click: function(t) {
                            return e.goToSettings()
                        }
                    }
                }), e.isDemo ? s("div", {
                    staticClass: "position-absolute",
                    staticStyle: {
                        bottom: "0",
                        "z-index": "9999",
                        opacity: "0.2"
                    }
                }, [s("span", {
                    staticClass: "btn btn-danger",
                    on: {
                        click: e.stopDemo
                    }
                }, [e._v("Demo Stop")])]) : e._e()], 2)
            },
            U = [],
            q = (s("7db0"), s("b0c0"), s("99af"), s("d81d"), s("a15b"), s("ac1f"), s("1276"), s("2ef0")),
            W = s.n(q),
            Y = {
                rk7XmlInterfaceAddress: "",
                rk7XmlInterfacePort: null,
                rk7UserName: "",
                rk7UserPassword: "",
                rk7CashStationCodes: [],
                rk7XmlInterfacePassword: "",
                logLevel: null,
                dateFormat: null,
                selfHostingPort: null,
                rk7CashServerCode: null,
                rk7RestaurantCode: null,
                rk7RefSyncTimeout: null,
                demoTimeout: 10,
                logPeriodDays: 1,
                paySymbol: "₽",
                defaultPortionName: "шт.",
                autoRun: !1,
                fontDefault: null,
                language: "ru",
                centralizationServerAddress: "",
                licServerAddress: "",
                licProtectServerAddress: "",
                weblateServerAddress: "",
                xmlIgnoreDelayTimeout: 5,
                mediaSourceType: "",
                webDavServerAddress: "",
                mediaSourceRaw: [],
                dishNameType: "",
                modiNameType: "",
                orderCategoryType: "",
                triadSeparator: "",
                penniesSeparator: ".",
                showPennies: !0,
                paySymbolLeft: !1,
                rkExtPropNames: [],
                showSummary: !0,
                runWatcherOnStartup: !1
            },
            G = {
                save: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return s = {
                                        rk7XmlInterfaceAddress: t.rk7XmlInterfaceAddress,
                                        rk7XmlInterfacePort: t.rk7XmlInterfacePort,
                                        rk7UserName: t.rk7UserName,
                                        rk7UserPassword: t.rk7UserPassword,
                                        rk7CashStationCodes: t.rk7CashStationCodes,
                                        rk7XmlInterfacePassword: t.rk7XmlInterfacePassword,
                                        logLevel: t.logLevel,
                                        dateFormat: t.dateFormat,
                                        selfHostingPort: t.selfHostingPort,
                                        rk7CashServerCode: t.rk7CashServerCode,
                                        rk7RestaurantCode: t.rk7RestaurantCode,
                                        rk7RefSyncTimeout: t.rk7RefSyncTimeout,
                                        demoTimeout: t.demoTimeout,
                                        logPeriodDays: t.logPeriodDays,
                                        paySymbol: t.paySymbol,
                                        defaultPortionName: t.defaultPortionName,
                                        autoRun: t.autoRun,
                                        fontDefault: t.fontDefault,
                                        language: t.language,
                                        centralizationServerAddress: t.centralizationServerAddress,
                                        licServerAddress: t.licServerAddress,
                                        licProtectServerAddress: t.licProtectServerAddress,
                                        weblateServerAddress: t.weblateServerAddress,
                                        webDavServerAddress: t.webDavServerAddress,
                                        xmlIgnoreDelayTimeout: t.xmlIgnoreDelayTimeout,
                                        mediaSourceType: t.mediaSourceType,
                                        mediaSourceRaw: t.mediaSourceRaw,
                                        dishNameType: t.dishNameType,
                                        modiNameType: t.modiNameType,
                                        orderCategoryType: t.orderCategoryType,
                                        showSummary: t.showSummary,
                                        triadSeparator: t.triadSeparator,
                                        penniesSeparator: t.penniesSeparator,
                                        showPennies: t.showPennies,
                                        paySymbolLeft: t.paySymbolLeft,
                                        rkExtPropNames: t.rkExtPropNames,
                                        runWatcherOnStartup: t.runWatcherOnStartup
                                    }, Array.isArray(s.rkExtPropNames) || (s.rkExtPropNames = s.rkExtPropNames.split(",")), e.abrupt("return", w.set(s));
                                case 3:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                saveScreens: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s, r, n, o, i;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    s = [], r = Object(a["a"])(t);
                                    try {
                                        for (r.s(); !(n = r.n()).done;) o = n.value, i = Object.assign(this.addNewScreen(), o), i.monitor = o.monitor ? o.monitor["deviceName"] : null, s.push(i)
                                    } catch (c) {
                                        r.e(c)
                                    } finally {
                                        r.f()
                                    }
                                    return e.abrupt("return", _.setScreens(s));
                                case 4:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                createFromRaw: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s, r, n, a, o, i, c;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    for (t.rkExtPropNames = Array.isArray(t.rkExtPropNames) ? t.rkExtPropNames.join(",") : t.rkExtPropNames, s = W.a.assign(Y, t), r = ["FromRk7Parameter", "FromLocalDir", "FromFtp", "FromHttp"], n = 0, a = r; n < a.length; n++) o = a[n], i = W.a.find(s.mediaSourceRaw, {
                                        type: o
                                    }), i || (c = void 0, "FromRk7Parameter" === o && (c = {
                                        type: "FromRk7Parameter"
                                    }), "FromLocalDir" === o && (c = {
                                        type: "FromLocalDir",
                                        path: ""
                                    }), "FromFtp" === o && (c = {
                                        type: "FromFtp",
                                        path: "/",
                                        host: "",
                                        port: "21",
                                        userName: "",
                                        password: "",
                                        enablePassiveMode: !0
                                    }), "FromHttp" === o && (c = {
                                        type: "FromHttp",
                                        path: "/",
                                        host: "",
                                        port: "21",
                                        userName: "",
                                        password: "",
                                        useHttps: !0
                                    }), s.mediaSourceRaw.push(c));
                                    return e.abrupt("return", s);
                                case 5:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                check: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        var s;
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return s = {
                                        rk7XmlInterfaceAddress: e.rk7XmlInterfaceAddress,
                                        rk7XmlInterfacePort: e.rk7XmlInterfacePort,
                                        rk7XmlInterfacePassword: e.rk7XmlInterfacePassword,
                                        rk7UserName: e.rk7UserName,
                                        rk7UserPassword: e.rk7UserPassword
                                    }, t.abrupt("return", w.checkXmlConnection(s));
                                case 2:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                getRefs: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", w.getRefs());
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                monitors: function() {
                    return w.getMonitorsList()
                },
                fontList: function() {
                    return w.getFonts()
                },
                getDateFormats: function() {
                    return Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, w.getDateFormats();
                                case 2:
                                    return e.abrupt("return", e.sent);
                                case 3:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })))()
                },
                getScreensList: function() {
                    return _.getScreensList()
                },
                getCashStationsList: function() {
                    return w.getCashStations()
                },
                addNewScreen: function() {
                    return {
                        guid: null,
                        monitor: null,
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0,
                        fullScreen: !1,
                        stayOnTop: !1,
                        enabled: !1,
                        name: null
                    }
                }
            },
            X = (s("4160"), s("c975"), s("159b"), {
                modesName: {
                    mode1: "Режим ожидания (до регистрации кассира)",
                    mode2: "Сервисный режим (кассир зарегистрирован)",
                    mode3: "Заказ. Изменения статуса",
                    mode31: "Заказ. Блюда не выбраны",
                    mode32: "Заказ. Режим добавления блюд",
                    mode4: "Заказ. Расчет и статус оплаты",
                    mode5: "Заказ. Печать чека",
                    mode11: "Заказ. Создание нового",
                    mode18: "Работа экрана с незапущеной кассой"
                },
                scenariosConditionName: {
                    with: "Наличие в заказе блюда из категорий:",
                    without: "Отсутствие в заказе блюда из категорий:",
                    last: "Последнее блюдо из категорий:",
                    withCodes: "Наличие в заказе блюда с кодами:",
                    withoutCodes: "Отсутствие в заказе блюда с кодами:",
                    lastCode: "Последнее блюдо с кодами:",
                    businessPeriod: "Периоды, для которого выполняется данный сценарий:",
                    restCode: "Коды ресторанов, для которого выполняется данный сценарий:",
                    payment: "Показывать, если:"
                },
                scenesTypeName: {
                    gallery: "Галерея",
                    image: "Изображение",
                    video: "Видео",
                    text: "Текст",
                    check: "Чек",
                    qualityService: "Качество сервиса",
                    qrCode: "QR-код",
                    display: "Экран",
                    custom: "Свой тип",
                    imageText: "Изображение с текстом",
                    dishImage: "Изображение товара"
                },
                colorList: [{
                    text: "mdcBlue",
                    value: "#5677fc"
                }, {
                    text: "mdcGreen",
                    value: "#259b24"
                }, {
                    text: "mdcOrange",
                    value: "#ff9800"
                }, {
                    text: "mdcDeePurple",
                    value: "#673ab7"
                }, {
                    text: "mdcYellow",
                    value: "#ffeb3b"
                }, {
                    text: "mdcRed",
                    value: "#e51c23"
                }, {
                    text: "mdcIndigo",
                    value: "#3f51b5"
                }, {
                    text: "mdcLighBlue",
                    value: "#03a9f4"
                }, {
                    text: "mdcAmber",
                    value: "#ffc107"
                }, {
                    text: "mdcCyan",
                    value: "#00bcd4"
                }, {
                    text: "mdcPurple",
                    value: "#9c27b0"
                }, {
                    text: "mdcTeal",
                    value: "#009688"
                }, {
                    text: "mdcLighGreen",
                    value: "#8bc34a"
                }, {
                    text: "mdcPink",
                    value: "#e91e63"
                }, {
                    text: "mdcLime",
                    value: "#cddc39"
                }, {
                    text: "mdcDeepOrange",
                    value: "#ff5722"
                }, {
                    text: "mdcWhite",
                    value: "#ffffff"
                }, {
                    text: "mdcBlack",
                    value: "#000000"
                }],
                getModesType: function(e) {
                    var t, s = [],
                        r = Object(a["a"])(e);
                    try {
                        for (r.s(); !(t = r.n()).done;) {
                            var n = t.value,
                                o = this.modesName[n] ? this.modesName[n] : n,
                                i = {
                                    value: n,
                                    text: o
                                };
                            s.push(i)
                        }
                    } catch (c) {
                        r.e(c)
                    } finally {
                        r.f()
                    }
                    return s
                },
                getScenarioConditionTypes: function(e) {
                    var t, s = [],
                        r = Object(a["a"])(e);
                    try {
                        for (r.s(); !(t = r.n()).done;) {
                            var n = t.value,
                                o = this.scenariosConditionName[n] ? this.scenariosConditionName[n] : n,
                                i = {
                                    value: n,
                                    text: o
                                };
                            s.push(i)
                        }
                    } catch (c) {
                        r.e(c)
                    } finally {
                        r.f()
                    }
                    return s
                },
                getScenecType: function(e) {
                    var t, s = [],
                        r = Object(a["a"])(e);
                    try {
                        for (r.s(); !(t = r.n()).done;) {
                            var n = t.value,
                                o = this.scenesTypeName[n] ? this.scenesTypeName[n] : n,
                                i = {
                                    value: n,
                                    text: o
                                };
                            s.push(i)
                        }
                    } catch (c) {
                        r.e(c)
                    } finally {
                        r.f()
                    }
                    return s
                },
                getColorList: function() {
                    return this.colorList
                },
                prepareFonts: function(e) {
                    var t = this,
                        s = [];
                    return e.forEach((function(e) {
                        var r = t.fontHandling(e);
                        s.push(r)
                    })), s
                },
                fontHandling: function(e) {
                    var t = ["woff", "woff2", "ttf", "svg", "otf"],
                        s = {
                            ext: null,
                            name: null,
                            fullName: e,
                            path: null,
                            cssImport: null
                        },
                        r = e.split("."),
                        n = Date.now();
                    return r.length > 1 && (s.ext = r[r.length - 1], s.ext = r.pop(), s.name = r.join("."), s.path = "./media/fonts/".concat(s.fullName), s.cssImport = "\n        @font-face {\n              font-family: '".concat(s.name, "';\n              src: local(\"").concat(s.name, '"), \n                   local("').concat(s.name, "\"),\n                   url('./media/fonts/").concat(s.fullName, "?t=").concat(n, "');\n              font-style: normal;\n              font-weight: normal;\n        }")), -1 === t.indexOf(s.ext) ? (s.error = "Недопустимый файл шрифта", s) : s
                }
            }),
            Z = {};

        function K() {
            return N
        }

        function Q(e) {
            return N = JSON.parse(JSON.stringify(e)), N
        }

        function J() {
            return Z.dishes
        }

        function ee() {
            return Z.dishCategories
        }

        function te() {
            return Z.periods
        }

        function se() {
            return Z.restaurants
        }

        function re() {
            return Z.scenarioConditionTypes
        }

        function ne() {
            return Z
        }

        function ae() {
            return Z.fontList
        }

        function oe() {
            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
            return e.map((function(e) {
                return {
                    code: e["code"],
                    name: e["name"],
                    text: "".concat(e["name"], " (").concat(e["code"], ")")
                }
            }))
        }

        function ie() {
            return ce.apply(this, arguments)
        }

        function ce() {
            return ce = Object(o["a"])(regeneratorRuntime.mark((function e() {
                var t, s;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            return e.next = 2, w.getList();
                        case 2:
                            return t = e.sent, e.next = 5, G.createFromRaw(t);
                        case 5:
                            return N = e.sent, localStorage.dateFormat = N.dateFormat, e.next = 9, w.getRefs();
                        case 9:
                            return s = e.sent, Z.stationModes = X.getModesType(s.stationModes), Z.scenarioConditionTypes = X.getScenarioConditionTypes(s.scenarioConditionTypes), Z.sceneTypes = X.getScenecType(s.sceneTypes), Z.colorList = X.getColorList(), e.next = 16, $.getMenu();
                        case 16:
                            return Z.dishes = e.sent, Z.dishes = oe(Z.dishes), e.next = 20, $.getDishCategories();
                        case 20:
                            return Z.dishCategories = e.sent, Z.dishCategories = oe(Z.dishCategories), e.next = 24, $.getPeriods();
                        case 24:
                            return Z.periods = e.sent, e.next = 27, $.getRestaurants();
                        case 27:
                            return Z.restaurants = e.sent, Z.restaurants = oe(Z.restaurants), e.next = 31, w.getFonts();
                        case 31:
                            Z.fontList = e.sent, Z.fontList = X.prepareFonts(Z.fontList);
                        case 33:
                        case "end":
                            return e.stop()
                    }
                }), e)
            }))), ce.apply(this, arguments)
        }
        s("a434"), s("4d63"), s("25f0"), s("3ca3"), s("5319"), s("ddb0");
        var le = s("ade3"),
            ue = s("5530"),
            me = (s("38cf"), s("cc71"), "uploads"),
            de = "dishImg",
            pe = "video",
            fe = "fonts",
            ve = Date.now(),
            ge = {
                imageText: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        var r, n, o, i, c;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    r = t.params.img, n = t.params.text, r.style = {
                                        position: "relative",
                                        background: "url(/media/" + me + "/" + r.fileName + "?t=" + ve + ")",
                                        "background-size": r.size.value,
                                        "background-color": r.color,
                                        "background-position": r.center ? "center" : "left top",
                                        "background-repeat": r.repeat.value,
                                        height: "100%",
                                        width: "100%"
                                    }, o = Object(a["a"])(n), e.prev = 4, o.s();
                                case 6:
                                    if ((i = o.n()).done) {
                                        e.next = 15;
                                        break
                                    }
                                    return c = i.value, e.next = 10, Pe.setShortCode(c.text, s);
                                case 10:
                                    c.text = e.sent, c.style = {
                                        position: "absolute",
                                        "font-size": c.size + "px",
                                        color: c.color,
                                        "font-family": null,
                                        "text-align": c.align,
                                        width: c.width + "px",
                                        height: c.height + "px",
                                        top: c.top + "px",
                                        left: c.left + "px"
                                    }, c = this.getImportFont(c);
                                case 13:
                                    e.next = 6;
                                    break;
                                case 15:
                                    e.next = 20;
                                    break;
                                case 17:
                                    e.prev = 17, e.t0 = e["catch"](4), o.e(e.t0);
                                case 20:
                                    return e.prev = 20, o.f(), e.finish(20);
                                case 23:
                                    return e.abrupt("return", t);
                                case 24:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this, [
                            [4, 17, 20, 23]
                        ])
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                text: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, Pe.setShortCode(t.params.text, s);
                                case 2:
                                    return t.params.text = e.sent, t.params.style = {
                                        "font-size": t.params.size + "px",
                                        "line-height": t.params.lineHeight,
                                        color: t.params.color,
                                        "font-family": null
                                    }, t.params = this.getImportFont(t.params), e.abrupt("return", t);
                                case 6:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                image: function(e) {
                    return e.params.style = null, e.params.src = null, e.params.full ? e.params.style = {
                        background: "url(/media/" + me + "/" + e.params.fileName + "?t=" + ve + ") center center no-repeat",
                        "background-size": "cover",
                        height: "100%",
                        width: "100%"
                    } : (e.params.height && e.params.width && (e.params.style = {
                        height: e.params.height + "px",
                        width: e.params.width + "px"
                    }), e.params.height || e.params.width || (e.params.style = {
                        height: "100%",
                        width: "auto"
                    }), !e.params.height && e.params.width && (e.params.style = {
                        height: "auto",
                        width: e.params.width + "px"
                    }), e.params.height && !e.params.width && (e.params.style = {
                        height: e.params.height + "px",
                        width: "auto"
                    }), e.params.src = "/media/".concat(me, "/").concat(e.params.fileName, "?t=").concat(ve)), e
                },
                dishImage: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        var r, n;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return r = s["dishes"], n = r ? r[r.length - 1] : {}, t.params.style = null, t.params.src = null, t.params.full ? t.params.style = {
                                        "background-image": "url(/media/".concat(de, "/").concat(n.image, ")"),
                                        "background-size": "cover",
                                        "background-repeat": "no-repeat",
                                        height: "100%",
                                        width: "100%"
                                    } : (t.params.style = {
                                        width: "auto",
                                        height: "auto"
                                    }, t.params.src = "/media/".concat(de, "/").concat(n.image, "?t=").concat(ve)), e.abrupt("return", t);
                                case 6:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                video: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return t.params.src = "/media/".concat(pe, "/").concat(t.params.fileName, "?t=").concat(ve), e.abrupt("return", t);
                                case 2:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                gallery: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        var r, n, o, i, c = this;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    r = [], n = Object(a["a"])(t.params.frame), e.prev = 2, i = regeneratorRuntime.mark((function e() {
                                        var n, a;
                                        return regeneratorRuntime.wrap((function(e) {
                                            while (1) switch (e.prev = e.next) {
                                                case 0:
                                                    n = o.value, e.t0 = n.type, e.next = "image" === e.t0 ? 4 : "imageText" === e.t0 ? 6 : 12;
                                                    break;
                                                case 4:
                                                    return n.style = {
                                                        background: "url(/media/" + me + "/" + n.name + "?t=" + ve + ") center center no-repeat",
                                                        "background-size": "cover",
                                                        "background-position": "center top",
                                                        height: "100%",
                                                        width: "100%"
                                                    }, e.abrupt("break", 12);
                                                case 6:
                                                    if (a = t.mappedScenes.find((function(e) {
                                                            return e.guid === n.guid
                                                        })), -1 === a) {
                                                        e.next = 11;
                                                        break
                                                    }
                                                    return e.next = 10, c.imageText(a, s);
                                                case 10:
                                                    n = e.sent;
                                                case 11:
                                                    return e.abrupt("break", 12);
                                                case 12:
                                                    r.push(n);
                                                case 13:
                                                case "end":
                                                    return e.stop()
                                            }
                                        }), e)
                                    })), n.s();
                                case 5:
                                    if ((o = n.n()).done) {
                                        e.next = 9;
                                        break
                                    }
                                    return e.delegateYield(i(), "t0", 7);
                                case 7:
                                    e.next = 5;
                                    break;
                                case 9:
                                    e.next = 14;
                                    break;
                                case 11:
                                    e.prev = 11, e.t1 = e["catch"](2), n.e(e.t1);
                                case 14:
                                    return e.prev = 14, n.f(), e.finish(14);
                                case 17:
                                    return t.params.frame = r, e.abrupt("return", t);
                                case 19:
                                case "end":
                                    return e.stop()
                            }
                        }), e, null, [
                            [2, 11, 14, 17]
                        ])
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                check: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        var r, n, a, o;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    r = ["price", "dish", "modi", "combo", "count", "rounding"], n = 0, a = r;
                                case 2:
                                    if (!(n < a.length)) {
                                        e.next = 12;
                                        break
                                    }
                                    if (o = a[n], !t.params[o]) {
                                        e.next = 9;
                                        break
                                    }
                                    return t.params[o].style = {
                                        "font-size": t.params[o].size + "px",
                                        color: t.params[o].color,
                                        "font-family": null,
                                        "font-weight": t.params[o].bold ? "bold" : "normal"
                                    }, e.next = 8, this.getImportFont(t.params[o]);
                                case 8:
                                    t.params[o] = e.sent;
                                case 9:
                                    n++, e.next = 2;
                                    break;
                                case 12:
                                    return t.params.other && (t.params.other.colStyle = {
                                        color: t.params.other.colNameColor
                                    }), e.abrupt("return", t);
                                case 14:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                custom: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", t);
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                display: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return t.params.style = {
                                        "font-family": t.params.font,
                                        color: t.params.color
                                    }, t.params.font && (t.params = this.getImportFont(t.params)), e.abrupt("return", t);
                                case 3:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                qrCode: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", t);
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                qualityService: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return t.params.style = {
                                        "font-size": t.params.size + "px",
                                        "font-family": null
                                    }, t.params = this.getImportFont(t.params), t.params.elements.forEach((function(e) {
                                        e.img && (e.src = "/media/".concat(me, "/").concat(e.img, "?t=").concat(ve))
                                    })), e.abrupt("return", t);
                                case 4:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getImportFont: function(e) {
                    if (e.font) {
                        var t = ae(),
                            s = t.find((function(t) {
                                return t.fullName === e.font
                            }));
                        s ? (e.style["font-family"] = "".concat(s.name, " !important"), e.importFont = "<style>".concat(s.cssImport, "</style>")) : e.importFont = ""
                    } else e.importFont = "";
                    return e
                }
            },
            he = (s("b680"), {
                getOrderSum: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", he.splitMoney(t.orderSum));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getDiscountSum: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", he.splitMoney(t.discountSum));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getUnpaidSum: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        var r;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, he.splitMoney(s.int - t.int);
                                case 2:
                                    if (r = e.sent, !(r.int < 0)) {
                                        e.next = 7;
                                        break
                                    }
                                    return e.next = 6, he.splitMoney(0);
                                case 6:
                                    r = e.sent;
                                case 7:
                                    return e.abrupt("return", r);
                                case 8:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getPaid: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    if (t["printCheck"] && t["printCheck"][0] && t["printCheck"][0]["pay"] && Array.isArray(t["printCheck"][0]["pay"]) && t["printCheck"][0]["pay"][0] && t["printCheck"][0]["pay"][0].amount) {
                                        e.next = 2;
                                        break
                                    }
                                    return e.abrupt("return", he.splitMoney(0, "getPaid"));
                                case 2:
                                    return s = 0, t["printCheck"].forEach((function(e) {
                                        e["pay"].forEach((function(e) {
                                            e.amount > 0 && (s += e.amount)
                                        }))
                                    })), e.abrupt("return", he.splitMoney(s, "getPaid"));
                                case 5:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getSurrender: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        var r;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, he.splitMoney(t.int - s.int);
                                case 2:
                                    if (r = e.sent, !(r.int < 0)) {
                                        e.next = 7;
                                        break
                                    }
                                    return e.next = 6, he.splitMoney(0);
                                case 6:
                                    r = e.sent;
                                case 7:
                                    return e.abrupt("return", r);
                                case 8:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                splitMoney: function(e) {
                    var t;
                    t = (e / 100).toFixed(2).toString(), t = t.split("."), t = {
                        int: e,
                        ruble: t[0],
                        penny: t[1]
                    };
                    var s = K();
                    return t.ruble = t.ruble.toString().replace(/(\d)(?=(\d{3})+$)/g, "$1" + s.triadSeparator).replace("-", "-"), t.penny = t.penny.toString(), s.showPennies ? t.string = t.ruble + s.penniesSeparator + t.penny : t.string = t.ruble, t
                },
                useDiscount: function(e) {
                    var t = K(),
                        s = (e.quantity ? e.quantity : e.count) / 1e3;
                    return e.discount ? t.showSummary ? he.splitMoney(e.price * s) : he.splitMoney((e.price - e.discount) * s) : he.splitMoney(e.price * s)
                },
                useDiscountForModi: function(e) {
                    var t = K(),
                        s = e.count;
                    return e.discount ? t.showSummary ? he.splitMoney(e.price * s) : he.splitMoney((e.price - e.discount) * s) : he.splitMoney(e.price * s)
                },
                getPrepMoney: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return t, s = {}, e.next = 4, he.getDiscountSum(t);
                                case 4:
                                    return s.discountSum = e.sent, e.next = 7, he.getOrderSum(t);
                                case 7:
                                    return s.orderSum = e.sent, e.next = 10, he.getPaid(t);
                                case 10:
                                    return s.paid = e.sent, e.next = 13, he.getUnpaidSum(s.paid, s.orderSum);
                                case 13:
                                    return s.unpaidSum = e.sent, e.next = 16, he.getSurrender(s.paid, s.orderSum);
                                case 16:
                                    return s.surrender = e.sent, e.abrupt("return", s);
                                case 18:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }()
            }),
            be = he,
            we = s("2f62");
        n["default"].use(we["a"]);
        var _e = new we["a"].Store({
            state: {
                pageTitle: "Guest Screen",
                isHideSidebar: !1,
                version: null,
                licKey: null,
                token: null,
                scene: {
                    type: null
                },
                settings: null,
                order: null,
                dishPriceList: null,
                modiPriceList: null,
                isDemo: !1
            },
            mutations: {
                setPageTitle: function(e, t) {
                    e.pageTitle = t
                },
                toggleSidebar: function(e) {
                    e.isHideSidebar = !e.isHideSidebar
                },
                toggleDemo: function(e, t) {
                    e.isDemo = t
                },
                setVersion: function(e, t) {
                    e.version = t
                },
                setLicKey: function(e, t) {
                    e.licKey = t
                },
                setToken: function(e, t) {
                    e.token = t
                },
                setSettings: function(e, t) {
                    e.settings = t
                },
                setOrder: function(e, t) {
                    e.order = t
                },
                setDishPriceList: function(e, t) {
                    e.dishPriceList = t
                },
                setModiPriceList: function(e, t) {
                    e.modiPriceList = t
                }
            }
        });

        function xe(e, t, s) {
            var r, n, a = void 0 === s ? 2166136261 : s;
            for (r = 0, n = e.length; r < n; r++) a ^= e.charCodeAt(r), a += (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
            return t ? ("0000000" + (a >>> 0).toString(16)).substr(-8) : a >>> 0
        }

        function ye(e, t) {
            var s, r = new RegExp("{" + t + ":(\\d+)}", "gm"),
                n = [];
            while (null !== (s = r.exec(e))) s.index === r.lastIndex && r.lastIndex++, n.push(s[1]);
            return n
        }

        function Ce(e) {
            return ke.apply(this, arguments)
        }

        function ke() {
            return ke = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                var s, r, n, a, o;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            if (s = W.a.clone(_e.state.dishPriceList), r = "" === t.join(",") ? "empty" : xe(t.join(",")), n = !!s && Date.now() - s.timeToken > 6e4, !s || !s[r] || n) {
                                e.next = 7;
                                break
                            }
                            return e.abrupt("return", s[r]);
                        case 7:
                            return e.next = 9, $.getMenuWithPrices({
                                stationId: null,
                                codes: t
                            });
                        case 9:
                            return a = e.sent, o = Date.now(), s ? (s.timeToken = o, s[r] = a) : s = Object(le["a"])({
                                timeToken: o
                            }, r, a), _e.commit("setDishPriceList", s), e.abrupt("return", a);
                        case 14:
                        case "end":
                            return e.stop()
                    }
                }), e)
            }))), ke.apply(this, arguments)
        }

        function Se(e) {
            return $e.apply(this, arguments)
        }

        function $e() {
            return $e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                var s, r, n, a, o;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            if (s = W.a.clone(_e.state.modiPriceList), r = "" === t.join(",") ? "empty" : xe(t.join(",")), n = !!s && Date.now() - s.timeToken > 6e4, !s || !s[r] || n) {
                                e.next = 7;
                                break
                            }
                            return e.abrupt("return", s[r]);
                        case 7:
                            return e.next = 9, $.getModifiersWithPrices({
                                stationId: null,
                                codes: t
                            });
                        case 9:
                            return a = e.sent, o = Date.now(), s ? (s.timeToken = o, s[r] = a) : s = Object(le["a"])({
                                timeToken: o
                            }, r, a), _e.commit("setModiPriceList", s), e.abrupt("return", a);
                        case 14:
                        case "end":
                            return e.stop()
                    }
                }), e)
            }))), $e.apply(this, arguments)
        }

        function Re(e) {
            return je.apply(this, arguments)
        }

        function je() {
            return je = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                var s, r, n;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            return s = ye(t, "dishPrice"), e.next = 3, Ce(s);
                        case 3:
                            return r = e.sent, r.length || s.forEach((function(e) {
                                var s = new RegExp("{dishPrice:" + e + "}", "gm");
                                t = t.replace(s, " ")
                            })), n = r.map(function() {
                                var e = Object(o["a"])(regeneratorRuntime.mark((function e(s) {
                                    var r, n;
                                    return regeneratorRuntime.wrap((function(e) {
                                        while (1) switch (e.prev = e.next) {
                                            case 0:
                                                if (r = new RegExp("{dishPrice:" + s["code"] + "}", "gm"), !s["price"]) {
                                                    e.next = 8;
                                                    break
                                                }
                                                return e.next = 4, be.splitMoney(s["price"]);
                                            case 4:
                                                n = e.sent, t = t.replace(r, n.string), e.next = 9;
                                                break;
                                            case 8:
                                                t = t.replace(r, " ");
                                            case 9:
                                            case "end":
                                                return e.stop()
                                        }
                                    }), e)
                                })));
                                return function(t) {
                                    return e.apply(this, arguments)
                                }
                            }()), e.next = 8, Promise.all(n);
                        case 8:
                            return e.abrupt("return", t);
                        case 9:
                        case "end":
                            return e.stop()
                    }
                }), e)
            }))), je.apply(this, arguments)
        }

        function Te(e) {
            return Oe.apply(this, arguments)
        }

        function Oe() {
            return Oe = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                var s, r;
                return regeneratorRuntime.wrap((function(e) {
                    while (1) switch (e.prev = e.next) {
                        case 0:
                            return s = ye(t, "dishName"), e.next = 3, Ce(s);
                        case 3:
                            return r = e.sent, r.forEach((function(e) {
                                var s = new RegExp("{dishName:" + e["code"] + "}", "gm");
                                t = t.replace(s, e["name"])
                            })), e.abrupt("return", t);
                        case 6:
                        case "end":
                            return e.stop()
                    }
                }), e)
            }))), Oe.apply(this, arguments)
        }
        var Pe = {
                getPaid: function(e) {
                    if (!e["printCheck"] || !e["printCheck"][0] || !e["printCheck"][0]["pay"] || !Array.isArray(e["printCheck"][0]["pay"]) || !e["printCheck"][0]["pay"][0] || !e["printCheck"][0]["pay"][0].amount) return 0;
                    var t = 0;
                    return e["printCheck"].forEach((function(e) {
                        e["pay"].forEach((function(e) {
                            e.amount > 0 && (t += e.amount)
                        }))
                    })), t
                },
                getPenny: function(e) {
                    var t = e % 100;
                    return 1 === t.toString().length ? t + "0" : t
                },
                getPaidPenny: function(e) {
                    var t = this.getPaid(e);
                    return t ? this.getPenny(t) : "00"
                },
                getSurrender: function(e) {
                    var t = this.getPaid(e),
                        s = e["orderSum"];
                    return t - s
                },
                getSurrenderPenny: function(e) {
                    var t = this.getSurrender(e);
                    return t ? this.getPenny(t) : "00"
                },
                setShortCode: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s) {
                        var r, n;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return r = ["orderSum", "orderName", "unpaidSum", "discountSum", "totalPieces", "role", "name", "currencySymbol", "surrender", "paid"], e.next = 3, K();
                                case 3:
                                    return n = e.sent, r.forEach((function(e) {
                                        var r = "{" + e + "}";
                                        switch (e) {
                                            case "totalPieces":
                                                t = s["totalPieces"] ? t.replace(new RegExp(r, "g"), s["totalPieces"]) : t.replace(new RegExp(r, "g"), "---");
                                                break;
                                            case "role":
                                                t = s.waiter ? t.replace(new RegExp(r, "g"), s.waiter.role.name) : t.replace(new RegExp(r, "g"), "---");
                                                break;
                                            case "name":
                                                t = s.waiter ? t.replace(new RegExp(r, "g"), s.waiter.name) : t.replace(new RegExp(r, "g"), "---");
                                                break;
                                            case "currencySymbol":
                                                t = t.replace(new RegExp(r, "g"), n.paySymbol);
                                                break;
                                            case "orderSum":
                                                t = s["orderSum"] ? t.replace(new RegExp(r, "g"), s.money.orderSum.string) : t.replace(new RegExp(r, "g"), "0");
                                                break;
                                            case "orderName":
                                                t = s["orderName"] ? t.replace(new RegExp(r, "g"), s.orderName) : t.replace(new RegExp(r, "g"), "---");
                                                break;
                                            case "unpaidSum":
                                                t = s["unpaidSum"] ? t.replace(new RegExp(r, "g"), s.money.unpaidSum.string) : t.replace(new RegExp(r, "g"), "0");
                                                break;
                                            case "discountSum":
                                                t = s["discountSum"] ? t.replace(new RegExp(r, "g"), s.money.discountSum.string) : t.replace(new RegExp(r, "g"), "0");
                                                break;
                                            case "surrender":
                                                t = s["printCheck"] ? t.replace(new RegExp(r, "g"), s.money.surrender.string) : t.replace(new RegExp(r, "g"), "0");
                                                break;
                                            case "paid":
                                                t = s["printCheck"] ? t.replace(new RegExp(r, "g"), s.money.paid.string) : t.replace(new RegExp(r, "g"), "0");
                                                break
                                        }
                                    })), e.next = 7, Re(t);
                                case 7:
                                    return t = e.sent, e.next = 10, Te(t);
                                case 10:
                                    return t = e.sent, e.abrupt("return", t);
                                case 12:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t, s) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                prepareParams: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    if (!t.skin) {
                                        e.next = 4;
                                        break
                                    }
                                    return e.next = 3, this.prepareSkins(t);
                                case 3:
                                    t = e.sent;
                                case 4:
                                    return e.abrupt("return", t);
                                case 5:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                prepareSkins: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s, r, n;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, be.getPrepMoney(t.orders);
                                case 2:
                                    t.orders.money = e.sent, s = Object(a["a"])(t.skin), e.prev = 4, s.s();
                                case 6:
                                    if ((r = s.n()).done) {
                                        e.next = 14;
                                        break
                                    }
                                    if (n = r.value, !n.scene) {
                                        e.next = 12;
                                        break
                                    }
                                    return e.next = 11, ge[n.scene.type](n.scene, t.orders);
                                case 11:
                                    n.scene = e.sent;
                                case 12:
                                    e.next = 6;
                                    break;
                                case 14:
                                    e.next = 19;
                                    break;
                                case 16:
                                    e.prev = 16, e.t0 = e["catch"](4), s.e(e.t0);
                                case 19:
                                    return e.prev = 19, s.f(), e.finish(19);
                                case 22:
                                    return e.abrupt("return", t);
                                case 23:
                                case "end":
                                    return e.stop()
                            }
                        }), e, null, [
                            [4, 16, 19, 22]
                        ])
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                prepareOrderDisheCombo: function(e) {
                    var t = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        var r, n, o;
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    r = Object(a["a"])(e), s.prev = 1, r.s();
                                case 3:
                                    if ((n = r.n()).done) {
                                        s.next = 10;
                                        break
                                    }
                                    return o = n.value, s.next = 7, t.prepareDishModifier(o.modi);
                                case 7:
                                    o.modi = s.sent;
                                case 8:
                                    s.next = 3;
                                    break;
                                case 10:
                                    s.next = 15;
                                    break;
                                case 12:
                                    s.prev = 12, s.t0 = s["catch"](1), r.e(s.t0);
                                case 15:
                                    return s.prev = 15, r.f(), s.finish(15);
                                case 18:
                                    return e.map((function(e) {
                                        e.comboModi.replaceName = null;
                                        var t, s = null,
                                            r = Object(a["a"])(e.modi);
                                        try {
                                            for (r.s(); !(t = r.n()).done;) {
                                                var n = t.value;
                                                n.replaceName && (s ? n.code < s.code && (s = n) : s = n), e.comboModi.replaceName = s ? s.name : null
                                            }
                                        } catch (o) {
                                            r.e(o)
                                        } finally {
                                            r.f()
                                        }
                                    })), s.abrupt("return", e);
                                case 20:
                                case "end":
                                    return s.stop()
                            }
                        }), s, null, [
                            [1, 12, 15, 18]
                        ])
                    })))()
                },
                prepareOrderDishes: function(e) {
                    var t = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function s() {
                        var r, n, i;
                        return regeneratorRuntime.wrap((function(s) {
                            while (1) switch (s.prev = s.next) {
                                case 0:
                                    if (e.dishes) {
                                        s.next = 2;
                                        break
                                    }
                                    return s.abrupt("return");
                                case 2:
                                    r = Object(a["a"])(e.dishes), s.prev = 3, r.s();
                                case 5:
                                    if ((n = r.n()).done) {
                                        s.next = 12;
                                        break
                                    }
                                    return i = n.value, s.next = 9, t.prepareDishModifier(i.modifiers);
                                case 9:
                                    i.modifiers = s.sent;
                                case 10:
                                    s.next = 5;
                                    break;
                                case 12:
                                    s.next = 17;
                                    break;
                                case 14:
                                    s.prev = 14, s.t0 = s["catch"](3), r.e(s.t0);
                                case 17:
                                    return s.prev = 17, r.f(), s.finish(17);
                                case 20:
                                    return e.dishes.map(function() {
                                        var e = Object(o["a"])(regeneratorRuntime.mark((function e(s) {
                                            var r, n, o, i;
                                            return regeneratorRuntime.wrap((function(e) {
                                                while (1) switch (e.prev = e.next) {
                                                    case 0:
                                                        s.money = be.useDiscount(s), W.a.isNil(s.refPrice) || (s.refPriceMoney = be.splitMoney(s.refPrice)), r = null, n = Object(a["a"])(s.modifiers);
                                                        try {
                                                            for (n.s(); !(o = n.n()).done;) i = o.value, i.replaceName && (r ? i.code < r.code && (r = i) : r = i)
                                                        } catch (c) {
                                                            n.e(c)
                                                        } finally {
                                                            n.f()
                                                        }
                                                        s.replaceName = r ? r.name : null, s.components = t.prepareOrderDisheCombo(s.components);
                                                    case 7:
                                                    case "end":
                                                        return e.stop()
                                                }
                                            }), e)
                                        })));
                                        return function(t) {
                                            return e.apply(this, arguments)
                                        }
                                    }()), s.abrupt("return", e);
                                case 22:
                                case "end":
                                    return s.stop()
                            }
                        }), s, null, [
                            [3, 14, 17, 20]
                        ])
                    })))()
                },
                prepareDishModifier: function(e) {
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        var s, r, n;
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return s = e && e.length ? e.map((function(e) {
                                        return e.code
                                    })) : [], t.next = 3, Se(s);
                                case 3:
                                    return r = t.sent, n = W.a.cloneDeep(e), e.forEach((function(e, t) {
                                        var s = null;
                                        r && r.length && (s = r.find((function(t) {
                                            return t.code === e.code
                                        })));
                                        var a = {};
                                        s && (a = Object(ue["a"])(Object(ue["a"])({}, e), s), a.money = be.useDiscountForModi(a), W.a.isNil(e.refPrice) || (a.refPriceMoney = be.splitMoney(e.refPrice))), n && Array.isArray(n) && n.splice(t, 1, a)
                                    })), t.abrupt("return", n);
                                case 7:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                getModiString: function(e) {
                    var t, s = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : ", ",
                        r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "name",
                        n = [],
                        o = Object(a["a"])(e);
                    try {
                        for (o.s(); !(t = o.n()).done;) {
                            var i = t.value;
                            if (i["saveInCheck"]) {
                                var c = i.name;
                                "shortName" !== r || W.a.isNil(i.shortName) ? "altName" !== r || W.a.isNil(i.altName) ? "altShortName" !== r || W.a.isNil(i.altShortName) || (c = i.altShortName) : c = i.altName : c = i.shortName, n.push(c)
                            }
                        }
                    } catch (l) {
                        o.e(l)
                    } finally {
                        o.f()
                    }
                    return n.join(s)
                }
            },
            Ne = (s("fc99"), function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    style: {
                        height: "100%",
                        width: "100%",
                        "text-align": e.options.params.full ? "" : e.options.params.align
                    }
                }, [e.options.params.full ? s("div", {
                    style: e.options.params.style
                }) : e._e(), e.options.params.full ? e._e() : s("img", {
                    style: e.options.params.style,
                    attrs: {
                        src: e.options.params["src"],
                        alt: ""
                    }
                })])
            }),
            Le = [],
            De = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                }
            },
            Fe = De,
            ze = Object(I["a"])(Fe, Ne, Le, !1, null, null, null),
            Me = ze.exports,
            Ae = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    style: {
                        height: "100%",
                        width: "100%",
                        "text-align": e.options.params.full ? "" : e.options.params.align
                    }
                }, [e.options.params.full ? s("div", {
                    style: e.options.params.style
                }) : e._e(), e.options.params.full ? e._e() : s("img", {
                    style: e.options.params.style,
                    attrs: {
                        src: e.options.params["src"],
                        alt: ""
                    }
                })])
            },
            Ie = [],
            Ee = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                }
            },
            Be = Ee,
            He = Object(I["a"])(Be, Ae, Ie, !1, null, null, null),
            Ve = He.exports,
            Ue = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticStyle: {
                        height: "100%",
                        width: "100%"
                    }
                }, [s("div", {
                    style: e.options.params.img.style
                }, e._l(e.options.params.text, (function(t, r) {
                    return s("div", {
                        key: r,
                        style: t.style
                    }, [s("span", {
                        domProps: {
                            innerHTML: e._s(t.importFont)
                        }
                    }), e._v(" " + e._s(t.text) + " ")])
                })), 0)])
            },
            qe = [],
            We = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                }
            },
            Ye = We,
            Ge = Object(I["a"])(Ye, Ue, qe, !1, null, null, null),
            Xe = Ge.exports,
            Ze = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticStyle: {
                        height: "100%",
                        width: "100%"
                    },
                    style: {
                        "text-align": e.options.params.align
                    }
                }, [s("span", {
                    domProps: {
                        innerHTML: e._s(e.options.params.importFont)
                    }
                }), s("span", {
                    style: e.options.params.style,
                    domProps: {
                        innerHTML: e._s(e.options.params.text)
                    }
                })])
            },
            Ke = [],
            Qe = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                }
            },
            Je = Qe,
            et = Object(I["a"])(Je, Ze, Ke, !1, null, null, null),
            tt = et.exports,
            st = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticStyle: {
                        height: "100%",
                        width: "100%",
                        background: "#000"
                    }
                }, [s("transition", {
                    attrs: {
                        name: "showvideo"
                    }
                }, [s("video", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: e.isShowVideo,
                        expression: "isShowVideo"
                    }],
                    staticClass: "embed-responsive-item",
                    style: {
                        width: "width" === e.options.params.contain ? "100%" : "auto",
                        height: "height" === e.options.params.contain ? "100%" : "auto",
                        background: e.options.params.background,
                        margin: "0 auto",
                        display: "block"
                    },
                    attrs: {
                        controls: e.options.params.controls,
                        loop: e.options.params.loop,
                        autoplay: e.options.params.autoplay,
                        preload: "auto",
                        src: e.options.params.src
                    },
                    domProps: {
                        muted: e.options.params.muted
                    }
                })])], 1)
            },
            rt = [],
            nt = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                data: function() {
                    return {
                        isShowVideo: !1
                    }
                },
                mounted: function() {
                    var e = this;
                    setTimeout((function() {
                        e.isShowVideo = !0
                    }), 10)
                }
            },
            at = nt,
            ot = (s("dfbb"), Object(I["a"])(at, st, rt, !1, null, null, null)),
            it = ot.exports,
            ct = function() {
                var e = this,
                    t = e.$createElement,
                    r = e._self._c || t;
                return r("div", {
                    attrs: {
                        id: "check-wrap"
                    }
                }, [r("div", {
                    staticClass: "check-ttl"
                }, [e._v(e._s(e.$t("theme.my_order")))]), r("span", {
                    domProps: {
                        innerHTML: e._s(e.options.params.dish.importFont)
                    }
                }), r("span", {
                    domProps: {
                        innerHTML: e._s(e.options.params.combo.importFont)
                    }
                }), r("span", {
                    domProps: {
                        innerHTML: e._s(e.options.params.modi.importFont)
                    }
                }), r("span", {
                    domProps: {
                        innerHTML: e._s(e.options.params.price.importFont)
                    }
                }), r("div", {
                    staticClass: "dishes-list"
                }, e._l(e.orders["dishes"], (function(t, n) {
                    return r("div", {
                        key: n,
                        staticClass: "dish"
                    }, [r("div", {
                        staticClass: "dish-main",
                        style: e.options.params.dish.style
                    }, [!t.image && e.options.params.showDishImg ? r("div", {
                        staticClass: "dish-img",
                        style: {
                            "background-image": "url(" + s("8980") + ")"
                        }
                    }) : e._e(), t.image && e.options.params.showDishImg ? r("div", {
                        staticClass: "dish-img",
                        style: {
                            "background-image": "url(/media/dishImg/" + t.image + ")"
                        }
                    }) : e._e(), r("div", {
                        staticClass: "dish-name"
                    }, [e._v(" " + e._s(t["replaceName"] ? t["replaceName"] : e.getDishName(t)) + ", "), e.getExtProps(t) ? r("span", {
                        staticClass: "prop-name"
                    }, [e._v(e._s(e.getExtProps(t)))]) : e._e(), r("span", {
                        staticClass: "portion"
                    }, [e._v(e._s(t["portionName"] ? t["portionName"] : e.settings.defaultPortionName))])]), e.usePerUnitOfWeight(t) ? r("dish-quantity-with-sum", {
                        staticClass: "dish-quantity",
                        attrs: {
                            dish: t,
                            settings: e.settings,
                            options: e.options
                        }
                    }) : [r("div", {
                        staticClass: "dish-quantity"
                    }, [e._v(" " + e._s(t["quantity"] / 1e3) + " ")]), e.settings.paySymbolLeft ? r("div", {
                        staticClass: "dish-amount",
                        style: e.options.params.price.style
                    }, [e._v(" " + e._s(e.settings.paySymbol) + e._s(t.money.string) + " ")]) : e._e(), e.settings.paySymbolLeft ? e._e() : r("div", {
                        staticClass: "dish-amount",
                        style: e.options.params.price.style
                    }, [e._v(" " + e._s(t.money.string) + e._s(e.settings.paySymbol) + " ")])]], 2), t["isCombo"] ? r("div", {
                        staticClass: "components-list",
                        style: e.options.params.combo.style
                    }, [e._l(e.getDishComponents(t), (function(n, a) {
                        return [r("div", {
                            key: a,
                            staticClass: "component-item"
                        }, [r("div", {
                            staticClass: "component-item__wrap"
                        }, [!n.image && e.options.params.showDishImg ? r("div", {
                            staticClass: "component-img",
                            style: {
                                "background-image": "url(" + s("8980") + ")"
                            }
                        }) : e._e(), n.image && e.options.params.showDishImg ? r("div", {
                            staticClass: "component-img",
                            style: {
                                "background-image": "url(/media/dishImg/" + n.image + ")"
                            }
                        }) : e._e(), r("div", {
                            staticClass: "component-name"
                        }, [e._v(" " + e._s(n["comboModi"]["replaceName"] ? n["comboModi"]["replaceName"] : e.getDishName(n["comboModi"])) + ", "), e.getExtProps(t) ? r("span", {
                            staticClass: "prop-name"
                        }, [e._v(e._s(e.getExtProps(t)))]) : e._e(), r("span", {
                            staticClass: "portion"
                        }, [e._v(e._s(n["portionName"] ? n["portionName"] : e.settings.defaultPortionName))])]), r("div", {
                            staticClass: "component-count"
                        }, [e._v(" " + e._s(n.count) + " ")]), r("div", {
                            staticClass: "component-amount"
                        })]), n["modi"].length > 0 && e.options.params.showModi ? [r("div", {
                            staticClass: "modifiers-list",
                            class: {
                                offset: !n.image && e.options.params.showDishImg
                            },
                            style: e.options.params.modi.style
                        }, e._l(n["modi"], (function(t, s) {
                            return r("div", {
                                directives: [{
                                    name: "show",
                                    rawName: "v-show",
                                    value: t["saveInCheck"],
                                    expression: "modifier['saveInCheck']"
                                }],
                                key: s,
                                staticClass: "modifier-item"
                            }, [r("div", {
                                staticClass: "modifier-name"
                            }, [e._v(e._s(t.name))]), r("div", {
                                staticClass: "modifier-count"
                            }, [e._v(e._s(t.count))]), r("div", {
                                staticClass: "modifier-amount"
                            }, [t.money ? [e.settings.paySymbolLeft ? r("div", {
                                style: e.options.params.price.style
                            }, [e._v(" " + e._s(e.settings.paySymbol) + e._s(t.money.string) + " ")]) : e._e(), e.settings.paySymbolLeft ? e._e() : r("div", {
                                style: e.options.params.price.style
                            }, [e._v(" " + e._s(t.money.string) + e._s(e.settings.paySymbol) + " ")])] : e._e()], 2)])
                        })), 0)] : e._e()], 2)]
                    }))], 2) : e._e(), !t["isCombo"] && e.options.params.showModi ? r("div", {
                        staticClass: "modifiers-list",
                        style: e.options.params.modi.style
                    }, e._l(e.getDishModifiers(t), (function(t, n) {
                        return r("div", {
                            directives: [{
                                name: "show",
                                rawName: "v-show",
                                value: t["saveInCheck"],
                                expression: "modifier['saveInCheck']"
                            }],
                            key: n,
                            staticClass: "modifier-item"
                        }, [!t.image && e.options.params.showDishImg ? r("div", {
                            staticClass: "modifier-img",
                            style: {
                                "background-image": "url(" + s("8980") + ")"
                            }
                        }) : e._e(), t.image && e.options.params.showDishImg ? r("div", {
                            staticClass: "modifier-img",
                            style: {
                                "background-image": "url(/media/dishImg/" + t.image + ")"
                            }
                        }) : e._e(), r("div", {
                            staticClass: "modifier-name"
                        }, [e._v(e._s(e.getModiName(t)))]), r("div", {
                            staticClass: "modifier-count"
                        }, [e._v(e._s(t.count))]), r("div", {
                            staticClass: "modifier-amount"
                        }, [t.money ? [e.settings.paySymbolLeft ? r("div", {
                            style: e.options.params.price.style
                        }, [e._v(" " + e._s(e.settings.paySymbol) + e._s(t.money.string) + " ")]) : e._e(), e.settings.paySymbolLeft ? e._e() : r("div", {
                            style: e.options.params.price.style
                        }, [e._v(" " + e._s(t.money.string) + e._s(e.settings.paySymbol) + " ")])] : e._e()], 2)])
                    })), 0) : e._e()])
                })), 0), r("div", {
                    staticClass: "total-wrap"
                }, [r("div", {
                    staticClass: "total-wrap__cnt"
                }, [e.settings.showSummary ? e._e() : [r("div", {
                    staticClass: "amount-text"
                }, [e._v(" " + e._s(e.$t("theme.order_price")) + " "), e.settings.paySymbolLeft ? r("span", {
                    staticClass: "total-sum"
                }, [e._v(" " + e._s(e.settings.paySymbol) + " " + e._s(e.orderSumStr) + " ")]) : e._e(), e.settings.paySymbolLeft ? e._e() : r("span", {
                    staticClass: "total-sum"
                }, [e._v(" " + e._s(e.orderSumStr) + " " + e._s(e.settings.paySymbol) + " ")])]), r("div", {
                    staticClass: "discount-text"
                }, [e._v(" " + e._s(e.$t("theme.order_discount")) + " "), e.settings.paySymbolLeft ? r("span", {
                    staticClass: "total-sum"
                }, [e._v(" " + e._s(e.settings.paySymbol) + " " + e._s(e.discountSumStr) + " ")]) : e._e(), e.settings.paySymbolLeft ? e._e() : r("span", {
                    staticClass: "total-sum"
                }, [e._v(" " + e._s(e.discountSumStr) + " " + e._s(e.settings.paySymbol) + " ")])])], r("div", {
                    staticClass: "total-text"
                }, [e._v(" " + e._s(e.$t("theme.amount_order")) + " "), e.settings.paySymbolLeft ? r("span", {
                    staticClass: "total-sum"
                }, [e._v(" " + e._s(e.settings.paySymbol) + " " + e._s(e.unpaidSumStr) + " ")]) : e._e(), e.settings.paySymbolLeft ? e._e() : r("span", {
                    staticClass: "total-sum"
                }, [e._v(" " + e._s(e.unpaidSumStr) + " " + e._s(e.settings.paySymbol) + " ")])])], 2)])])
            },
            lt = [],
            ut = (s("4de4"), s("b64b"), {
                PmPerPiece: "PmPerPiece",
                PmPerPortion: "PmPerPortion",
                PmPerUnitOfWeight: "PmPerUnitOfWeight",
                PmPerDose: "PmPerDose"
            }),
            mt = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    },
                    orders: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                data: function() {
                    return {
                        dishesImagesFolder: de,
                        settings: _e.state.settings
                    }
                },
                methods: {
                    getExtProps: function(e) {
                        return e.extProps ? e.extProps[Object.keys(e.extProps)[0]] : ""
                    },
                    getDishName: function(e) {
                        var t = e.name;
                        return "shortName" !== this.settings.dishNameType || W.a.isNil(e.shortName) ? "altName" !== this.settings.dishNameType || W.a.isNil(e.altName) ? "altShortName" !== this.settings.dishNameType || W.a.isNil(e.altShortName) || (t = e.altShortName) : t = e.altName : t = e.shortName, t
                    },
                    getModiName: function(e) {
                        var t = e.name;
                        return "shortName" !== this.settings.modiNameType || W.a.isNil(e.shortName) ? "altName" !== this.settings.modiNameType || W.a.isNil(e.altName) ? "altShortName" !== this.settings.modiNameType || W.a.isNil(e.altShortName) || (t = e.altShortName) : t = e.altName : t = e.shortName, t
                    },
                    getDishComponents: function(e) {
                        var t = e["components"] || [];
                        return this.options.params.showZeroCountComboComponents ? t : W.a.filter(t, (function(e) {
                            return 0 !== e.count
                        }))
                    },
                    getDishModifiers: function(e) {
                        var t = e["modifiers"] || [];
                        return this.options.params.showZeroCountModifiers ? t : W.a.filter(t, (function(e) {
                            return 0 !== e.count
                        }))
                    },
                    usePerUnitOfWeight: function(e) {
                        return !W.a.isNil(e.priceMode) && (!W.a.isNil(e.refPrice) && (!W.a.isNil(e.refPriceMoney) && (e.priceMode === ut.PmPerUnitOfWeight && !0 === this.options.params.showPriceOfWeightDishes)))
                    }
                }
            },
            dt = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", [s("pay-sum", {
                    staticClass: "d-inline-block",
                    attrs: {
                        "pay-symbol": e.settings.paySymbol,
                        "pay-symbol-left": e.settings.paySymbolLeft,
                        sum: e.dish.refPriceMoney.string
                    }
                }), s("span", {
                    staticClass: "multiple-symbol"
                }, [e._v("*")]), s("dish-quantity", {
                    staticClass: "d-inline-block",
                    attrs: {
                        dish: e.dish,
                        "default-portion-name": e.settings.defaultPortionName
                    }
                }), s("span", {
                    staticClass: "equal-symbol"
                }, [e._v("=")]), s("pay-sum", {
                    staticClass: "d-inline-block",
                    style: e.options.params.price.style,
                    attrs: {
                        "pay-symbol": e.settings.paySymbol,
                        "pay-symbol-left": e.settings.paySymbolLeft,
                        sum: e.dish.money.string
                    }
                })], 1)
            },
            pt = [],
            ft = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", [e.paySymbolLeft ? s("div", [e._v(" " + e._s(e.paySymbol) + e._s(e.sum) + " ")]) : s("div", [e._v(" " + e._s(e.sum) + e._s(e.paySymbol) + " ")])])
            },
            vt = [],
            gt = {
                name: "PaySum",
                props: {
                    sum: {
                        type: String,
                        default: ""
                    },
                    paySymbol: {
                        type: String,
                        default: ""
                    },
                    paySymbolLeft: {
                        type: Boolean,
                        default: !1
                    }
                }
            },
            ht = gt,
            bt = Object(I["a"])(ht, ft, vt, !1, null, "3fd44b40", null),
            wt = bt.exports,
            _t = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "dish-quantity-wrapper"
                }, [e._v(" " + e._s(e.quantity) + " " + e._s(e.portionName) + " ")])
            },
            xt = [],
            yt = {
                name: "DishQuantity",
                props: {
                    dish: {
                        type: Object,
                        required: !0
                    },
                    defaultPortionName: {
                        type: String,
                        default: ""
                    }
                },
                computed: {
                    quantity: function() {
                        return this.dish.quantity / 1e3
                    },
                    portionName: function() {
                        return this.dish.portionName ? this.dish.portionName : this.defaultPortionName
                    }
                }
            },
            Ct = yt,
            kt = (s("c26f"), Object(I["a"])(Ct, _t, xt, !1, null, "05c92bd1", null)),
            St = kt.exports,
            $t = {
                name: "DishQuantityWithSum",
                components: {
                    PaySum: wt,
                    DishQuantity: St
                },
                props: {
                    dish: {
                        type: Object,
                        required: !0
                    },
                    settings: {
                        type: Object,
                        required: !0
                    },
                    options: {
                        type: Object,
                        required: !0
                    }
                }
            },
            Rt = $t,
            jt = (s("e226"), Object(I["a"])(Rt, dt, pt, !1, null, "1ead8474", null)),
            Tt = jt.exports,
            Ot = {
                mixins: [mt],
                components: {
                    DishQuantityWithSum: Tt
                },
                data: function() {
                    return {
                        dishesImagesFolder: de,
                        settings: _e.state.settings
                    }
                },
                watch: {
                    orders: function() {
                        var e = this;
                        setTimeout((function() {
                            var t = e.$el.querySelector(".dishes-list");
                            t.scrollTop = t.scrollHeight
                        }), 1)
                    }
                },
                created: function() {
                    var e = this;
                    this.$nextTick((function() {
                        setTimeout((function() {
                            var t = e.$el.querySelector(".dishes-list");
                            t.scrollTop = t.scrollHeight
                        }), 1)
                    }))
                },
                methods: {
                    getModi: function(e, t, s) {
                        return Pe.getModiString(e, t, s)
                    }
                },
                computed: {
                    paidSumStr: function() {
                        return this.orders && this.orders.money && this.orders.money.paid ? this.orders.money.paid.string : ""
                    },
                    orderSumStr: function() {
                        return this.orders && this.orders.money && this.orders.money.orderSum ? this.orders.money.orderSum.string : ""
                    },
                    discountSumStr: function() {
                        return this.orders && this.orders.money && this.orders.money.discountSum ? this.orders.money.discountSum.string : ""
                    },
                    unpaidSumStr: function() {
                        return this.orders && this.orders.money && this.orders.money.unpaidSum ? this.orders.money.unpaidSum.string : ""
                    }
                }
            },
            Pt = Ot,
            Nt = (s("91f5"), Object(I["a"])(Pt, ct, lt, !1, null, null, null)),
            Lt = Nt.exports,
            Dt = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("h1", [e._v("Custom")])
            },
            Ft = [],
            zt = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                }
            },
            Mt = zt,
            At = Object(I["a"])(Mt, Dt, Ft, !1, null, null, null),
            It = At.exports,
            Et = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return e.options.params ? s("b-carousel", {
                    attrs: {
                        interval: 1e3 * parseInt(e.options.params.interval) || 5e3,
                        "no-hover-pause": "",
                        fade: ""
                    }
                }, e._l(e.options.params.frame, (function(t, r) {
                    return s("b-carousel-slide", {
                        key: r,
                        attrs: {
                            id: "carousel"
                        },
                        scopedSlots: e._u([{
                            key: "img",
                            fn: function() {
                                return ["image" === t.type ? s("div", {
                                    style: t.style
                                }) : e._e(), "video" === t.type ? s("videoCmp", {
                                    attrs: {
                                        options: e.videoOptions(t)
                                    }
                                }) : e._e(), "imageText" === t.type && t.params ? s("div", {
                                    style: t.params.img.style
                                }, e._l(t.params.text, (function(t, r) {
                                    return s("div", {
                                        key: r,
                                        style: t.style
                                    }, [e._v(" " + e._s(t.text) + " ")])
                                })), 0) : e._e()]
                            },
                            proxy: !0
                        }], null, !0)
                    })
                })), 1) : e._e()
            },
            Bt = [],
            Ht = {
                components: {
                    videoCmp: it
                },
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                methods: {
                    videoOptions: function(e) {
                        return {
                            params: {
                                src: "/media/".concat(pe, "/").concat(e.name, "?t=").concat(Date.now()),
                                controls: !1,
                                muted: !0,
                                loop: !0,
                                autoplay: !0,
                                background: "#000000",
                                contain: "width"
                            }
                        }
                    }
                }
            },
            Vt = Ht,
            Ut = (s("8513"), Object(I["a"])(Vt, Et, Bt, !1, null, null, null)),
            qt = Ut.exports,
            Wt = function() {
                var e = this,
                    t = e.$createElement,
                    r = e._self._c || t;
                return r("div", {
                    staticClass: "display"
                }, ["mode4" === e.modeType ? r("div", {
                    staticClass: "table-wrapp font-weight-bold",
                    staticStyle: {
                        "margin-top": "85px"
                    }
                }, [r("div", {
                    staticClass: "row your-order-pay",
                    style: e.options.params.style
                }, [r("div", {
                    staticClass: "col-2"
                }, [e._v(e._s(e.$t("paid")))]), r("div", {
                    staticClass: "col-6"
                }, [e.settings.paySymbolLeft ? r("span", [e._v(e._s(e.settings.paySymbol))]) : e._e(), r("span", {
                    staticClass: "sum"
                }, [e._v(e._s(e.orders.money.paid.ruble))]), r("span", {
                    staticClass: "small-penny"
                }, [e._v(" " + e._s(e.orders.money.paid.penny))]), e.settings.paySymbolLeft ? e._e() : r("span", [e._v(e._s(e.settings.paySymbol))])])]), r("div", {
                    staticClass: "row your-order-pay",
                    style: e.options.params.style
                }, [r("div", {
                    staticClass: "col-2"
                }, [e._v(e._s(e.$t("surrender")))]), r("div", {
                    staticClass: "col-6"
                }, [e.settings.paySymbolLeft ? r("span", [e._v(e._s(e.settings.paySymbol))]) : e._e(), r("span", {
                    staticClass: "sum"
                }, [e._v(e._s(e.orders.money.surrender.ruble))]), r("span", {
                    staticClass: "small-penny"
                }, [e._v(" " + e._s(e.orders.money.surrender.penny))]), e.settings.paySymbolLeft ? e._e() : r("span", [e._v(e._s(e.settings.paySymbol))])])]), r("div", {
                    staticClass: "row your-order-sum",
                    style: e.options.params.style
                }, [r("div", {
                    staticClass: "col-6 text-left"
                }, [e._v(e._s(e.$t("your_order")))]), r("div", {
                    staticClass: "col-6 text-right"
                }, [e.settings.paySymbolLeft ? r("span", [e._v(e._s(e.settings.paySymbol))]) : e._e(), e._v(" " + e._s(e.orderSumRuble)), r("span", {
                    staticClass: "penny"
                }, [e._v(" " + e._s(e.orderSumPenny))]), e.settings.paySymbolLeft ? e._e() : r("span", [e._v(e._s(e.settings.paySymbol))])])])]) : e._e(), "mode32" === e.modeType ? r("div", {
                    staticClass: "table-wrapp font-weight-bold"
                }, [r("span", {
                    domProps: {
                        innerHTML: e._s(e.options.params.importFont)
                    }
                }), r("div", {
                    staticClass: "orders-sum",
                    style: e.options.params.style
                }, [r("img", {
                    attrs: {
                        src: s("a274"),
                        alt: ""
                    }
                }), r("span", {
                    staticClass: "order-sum__title"
                }, [e._v(e._s(e.$t("your_order")))]), e.settings.paySymbolLeft ? r("span", [e._v(e._s(e.settings.paySymbol))]) : e._e(), r("span", [e._v(e._s(e.orderSumRuble))]), r("span", {
                    staticClass: "penny"
                }, [e._v(e._s(e.orderSumPenny))]), e.settings.paySymbolLeft ? e._e() : r("span", [e._v(e._s(e.settings.paySymbol))])]), e.lastDishes ? r("div", {
                    staticClass: "order"
                }, [r("div", {
                    staticClass: "row your-order-pay",
                    style: e.options.params.style
                }, [r("div", {
                    staticClass: "col-12"
                }, [e._v(e._s(e.$t("you_just_ordered")) + " "), r("span", {
                    staticClass: "ml-4"
                }, [e._v(e._s(e.lastDishes["quantity"] / 1e3) + " " + e._s(e.lastDishes["portionName"] ? e.lastDishes["portionName"] : e.settings.defaultPortionName))])])]), r("div", {
                    staticClass: "row your-order-pay",
                    style: e.options.params.style
                }, [r("div", {
                    staticClass: "col-8"
                }, [r("div", {
                    staticClass: "order-name"
                }, [e._v(e._s(e.lastDishes["name"]))]), e.lastDishes["modifiers"] && e.options.params.showModi ? r("div", {
                    staticClass: "modifiers"
                }, [e._v(" " + e._s(e.getModi(e.lastDishes["modifiers"], ", ")) + " ")]) : e._e(), e.lastDishes["components"] ? r("div", {
                    staticClass: "modifiers"
                }, [e._v(" " + e._s(e.getModi(e.lastDishes["modifiers"], ", ")) + " ")]) : e._e()]), r("div", {
                    staticClass: "col-4 order-sum text-right",
                    style: e.options.params.style
                }, [e.settings.paySymbolLeft ? r("span", [e._v(e._s(e.settings.paySymbol))]) : e._e(), e._v(" " + e._s(e.lastDishesRuble)), r("span", {
                    staticClass: "penny"
                }, [e._v(" " + e._s(e.lastDishesPenny))]), e.settings.paySymbolLeft ? e._e() : r("span", [e._v(e._s(e.settings.paySymbol))])])])]) : e._e()]) : e._e()])
            },
            Yt = [],
            Gt = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    },
                    orders: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    },
                    modeType: {
                        type: String,
                        default: function() {
                            return ""
                        }
                    }
                },
                data: function() {
                    return {
                        settings: _e.state.settings
                    }
                },
                created: function() {
                    window.X = this
                },
                computed: {
                    dishes: function() {
                        return this.orders["dishes"] || []
                    },
                    lastDishes: function() {
                        var e = this.orders["dishes"];
                        return e ? e[e.length - 1] : {}
                    },
                    orderSumRuble: function() {
                        return this.orders && this.orders.money && this.orders.money.orderSum ? this.orders.money.orderSum.ruble : ""
                    },
                    orderSumPenny: function() {
                        return this.orders && this.orders.money && this.orders.money.orderSum ? this.orders.money.orderSum.penny : ""
                    },
                    lastDishesRuble: function() {
                        return this.lastDishes && this.lastDishes.money ? this.lastDishes.money.ruble : ""
                    },
                    lastDishesPenny: function() {
                        return this.lastDishes && this.lastDishes.money ? this.lastDishes.money.penny : ""
                    }
                },
                methods: {
                    getModi: function(e, t) {
                        return Pe.getModiString(e, t)
                    }
                }
            },
            Xt = Gt,
            Zt = (s("8127"), Object(I["a"])(Xt, Wt, Yt, !1, null, null, null)),
            Kt = Zt.exports,
            Qt = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("h1", [e._v("qrCode")])
            },
            Jt = [],
            es = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                }
            },
            ts = es,
            ss = Object(I["a"])(ts, Qt, Jt, !1, null, null, null),
            rs = ss.exports,
            ns = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticStyle: {
                        height: "100%",
                        width: "100%"
                    }
                }, [s("span", {
                    domProps: {
                        innerHTML: e._s(e.options.params.importFont)
                    }
                }), e.voteComplit ? e._e() : s("div", {
                    staticClass: "quality-block",
                    style: e.options.params.style
                }, e._l(e.options.params.elements, (function(t, r) {
                    return s("div", {
                        key: r,
                        staticClass: "quality-el",
                        style: {
                            width: 100 / e.options.params.elements.length + "%"
                        },
                        on: {
                            click: function(s) {
                                return e.qualityVote(t)
                            }
                        }
                    }, [s("div", {
                        staticClass: "quality-el-img"
                    }, [s("img", {
                        attrs: {
                            src: t.src,
                            alt: ""
                        }
                    })])])
                })), 0), e.voteComplit ? s("div", {
                    staticClass: "vote-cmplit",
                    style: {
                        color: e.options.params.message.color,
                        "font-size": e.options.params.message.size + "px"
                    }
                }, [s("span", [e._v(e._s(e.options.params.message.text))])]) : e._e()])
            },
            as = [],
            os = {
                props: {
                    options: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    },
                    orders: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                data: function() {
                    return {
                        voteComplit: !1
                    }
                },
                methods: {
                    qualityVote: function(e) {
                        var t = {
                            value: e.value,
                            waiter: {
                                code: this.orders.waiter.code,
                                id: this.orders.waiter.id,
                                name: this.orders.waiter.name
                            }
                        };
                        b.addVote(t, "addVote"), this.voteComplit = !0
                    }
                }
            },
            is = os,
            cs = (s("3167"), Object(I["a"])(is, ns, as, !1, null, null, null)),
            ls = cs.exports,
            us = {
                name: "ScreenPage",
                components: {
                    imageScene: Me,
                    dishImageScene: Ve,
                    imageTextScene: Xe,
                    textScene: tt,
                    videoScene: it,
                    checkScene: Lt,
                    customScene: It,
                    galleryScene: qt,
                    displayScene: Kt,
                    qrCodeScene: rs,
                    qualityServiceScene: ls
                },
                data: function() {
                    return {
                        modeType: null,
                        skin: [],
                        orders: {},
                        countClick: 0,
                        settings: null,
                        fontList: [],
                        isShangeMode: !1,
                        defaultFont: ""
                    }
                },
                computed: {
                    isDemo: function() {
                        return this.$store.state.isDemo
                    }
                },
                created: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return window.changeMode = function(t) {
                                        e.callFromCashbox(t)
                                    }, e.settings = K(), e.$store.commit("setSettings", e.settings), e.fontList = ae(), t.next = 6, e.getDefaultFont();
                                case 6:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                beforeCreate: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, b.sysInfo(null, "sysInfo").then((function(t) {
                                        t.error ? e.$router.push({
                                            name: "auth"
                                        }) : (e.$store.commit("setVersion", t.version), e.$store.commit("setLicKey", t.licKey))
                                    }));
                                case 2:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    callFromCashbox: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        return t.isShangeMode = !1, e = JSON.parse(e), t.isShangeMode = !0, s.next = 5, Pe.prepareParams(e);
                                    case 5:
                                        return r = s.sent, t.modeType = r.mode, t.skin = r.skin ? r.skin : [], s.next = 10, Pe.prepareOrderDishes(r.orders);
                                    case 10:
                                        t.orders = s.sent, t.$store.commit("setOrder", t.orders), t.isShangeMode = !0;
                                    case 13:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    startDemo: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, R.start();
                                    case 2:
                                        e.$store.commit("toggleDemo", !0), console.log("Start DEMO");
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    stopDemo: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, R.stop();
                                    case 2:
                                        e.$store.commit("toggleDemo", !1), console.log("Stop DEMO"), e.skin = [], e.modeType = null;
                                    case 6:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    goToSettings: function() {
                        this.countClick++, 5 === this.countClick && (this.$router.push({
                            name: "modes"
                        }), this.countClick = 0)
                    },
                    getDefaultFont: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        if (e.settings.fontDefault) {
                                            t.next = 4;
                                            break
                                        }
                                        e.defaultFont = "", t.next = 9;
                                        break;
                                    case 4:
                                        return t.next = 6, ae();
                                    case 6:
                                        s = t.sent, r = s.find((function(t) {
                                            return t.fullName === e.settings.fontDefault
                                        })), e.defaultFont = r ? {
                                            style: "".concat(r.name, " !important"),
                                            importFont: "<style>".concat(r.cssImport, "</style>")
                                        } : {
                                            style: "",
                                            importFont: ""
                                        };
                                    case 9:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    }
                }
            },
            ms = us,
            ds = (s("4d90"), Object(I["a"])(ms, V, U, !1, null, null, null)),
            ps = ds.exports,
            fs = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    attrs: {
                        id: "wrapper"
                    }
                }, [s("main-header"), s("div", {
                    staticClass: "content-container",
                    class: {
                        "is-hide-sidebar": e.isHide
                    }
                }, [s("transition", {
                    attrs: {
                        name: "fade",
                        mode: "out-in"
                    }
                }, [s("router-view")], 1)], 1), s("sidebar")], 1)
            },
            vs = [],
            gs = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("aside", {
                    staticClass: "sidebar",
                    class: {
                        hide: e.isHide
                    }
                }, [e._m(0), s("div", {
                    staticClass: "nav"
                }, [s("ul", [s("li", {
                    staticClass: "nav-link"
                }, [s("router-link", {
                    staticClass: "mdi mdi-view-dashboard",
                    attrs: {
                        to: "/modes"
                    }
                }, [s("span", {
                    staticClass: "nav-link__text"
                }, [e._v(" " + e._s(e.$t("modes")))])])], 1), s("li", {
                    staticClass: "nav-link"
                }, [s("router-link", {
                    staticClass: "mdi mdi-image-multiple-outline",
                    attrs: {
                        to: {
                            path: "/scenarios"
                        }
                    }
                }, [s("span", {
                    staticClass: "nav-link__text"
                }, [e._v(" " + e._s(e.$t("scenarios")))])])], 1), s("li", {
                    staticClass: "nav-link"
                }, [s("router-link", {
                    staticClass: "mdi mdi-shape-plus",
                    attrs: {
                        to: "/scenes"
                    }
                }, [s("span", {
                    staticClass: "nav-link__text"
                }, [e._v(" " + e._s(e.$t("scenes")))])])], 1), s("li", {
                    staticClass: "nav-link"
                }, [s("router-link", {
                    staticClass: "mdi mdi-vote-outline",
                    attrs: {
                        to: "/votes"
                    }
                }, [s("span", {
                    staticClass: "nav-link__text"
                }, [e._v(" " + e._s(e.$t("voting")))])])], 1)])]), s("div", {
                    staticClass: "version"
                }, [e._v("api-"), s("b", {
                    staticClass: "mr-2"
                }, [e._v(e._s(e.version))]), e._v(" front-"), s("b", [e._v(e._s(e.versionFront))])])])
            },
            hs = [function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "header"
                }, [s("div", {
                    staticClass: "logo"
                }, [e._v(" r_keeper"), s("span", [e._v("_guest_screen")])])])
            }],
            bs = {
                name: "Sidebar",
                computed: {
                    isHide: function() {
                        return _e.state.isHideSidebar
                    },
                    version: function() {
                        return _e.state.version
                    },
                    versionFront: function() {
                        return "1.0.76"
                    }
                }
            },
            ws = bs,
            _s = (s("6e67"), Object(I["a"])(ws, gs, hs, !1, null, null, null)),
            xs = _s.exports,
            ys = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("header", {
                    staticClass: "main-header"
                }, [s("div", {
                    staticClass: "toggle-sidebar mdi mdi-menu",
                    on: {
                        click: e.toggleSidebar
                    }
                }), s("div", {
                    staticClass: "main-title"
                }, [e._v(" " + e._s(e.pageTitle) + " ")]), s("div", {
                    staticClass: "top-menu"
                }, [s("span", {
                    staticClass: "btn demo",
                    on: {
                        click: e.startDemo
                    }
                }, [e._v("DEMO")]), e._m(0), s("router-link", {
                    staticClass: "btn",
                    attrs: {
                        to: "/settings"
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-cog"
                })])], 1)])
            },
            Cs = [function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("a", {
                    staticClass: "btn",
                    attrs: {
                        href: "/"
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-cast-connected"
                })])
            }],
            ks = {
                computed: {
                    pageTitle: function() {
                        return _e.state.pageTitle
                    }
                },
                methods: {
                    toggleSidebar: function() {
                        this.$store.commit("toggleSidebar")
                    },
                    startDemo: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, R.start();
                                    case 2:
                                        e.$store.commit("toggleDemo", !0), e.$router.push({
                                            name: "screen"
                                        }), console.log("Start DEMO");
                                    case 5:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    }
                }
            },
            Ss = ks,
            $s = (s("6c3e"), Object(I["a"])(Ss, ys, Cs, !1, null, null, null)),
            Rs = $s.exports,
            js = {
                name: "Configurator",
                components: {
                    Sidebar: xs,
                    MainHeader: Rs
                },
                computed: {
                    isHide: function() {
                        return _e.state.isHideSidebar
                    }
                },
                beforeCreate: function() {
                    var e = this;
                    b.sysInfo(null, "sysInfo").then((function(t) {
                        t.error ? e.$router.push({
                            name: "auth"
                        }) : (e.$store.commit("setVersion", t.version), e.$store.commit("setLicKey", t.licKey))
                    }))
                },
                created: function() {
                    R.stop()
                }
            },
            Ts = js,
            Os = (s("a88b"), Object(I["a"])(Ts, fs, vs, !1, null, null, null)),
            Ps = Os.exports,
            Ns = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-dashboard"
                }, [e.test ? s("b-card-group", {
                    attrs: {
                        deck: ""
                    }
                }, [s("b-card", {
                    attrs: {
                        "border-variant": "primary",
                        header: e.$t("modes"),
                        "header-bg-variant": "primary",
                        "header-text-variant": "white",
                        align: "center"
                    }
                }, [s("b-card-text")], 1), s("b-card", {
                    attrs: {
                        "border-variant": "info",
                        header: e.$t("scenarios"),
                        "header-bg-variant": "info",
                        "header-text-variant": "white",
                        align: "center"
                    }
                }, [s("b-card-text")], 1), s("b-card", {
                    attrs: {
                        "border-variant": "success",
                        header: "Сцены",
                        "header-bg-variant": "success",
                        "header-text-variant": "white",
                        align: "center"
                    }
                }, [s("b-card-text")], 1)], 1) : e._e(), s("div", {
                    staticClass: "humster"
                })], 1)
            },
            Ls = [],
            Ds = {
                name: "Dashboard",
                data: function() {
                    return {
                        settings: K(),
                        test: !1
                    }
                },
                mounted: function() {
                    this.$store.commit("setPageTitle", "Dashboard")
                },
                methods: {}
            },
            Fs = Ds,
            zs = (s("f346"), Object(I["a"])(Fs, Ns, Ls, !1, null, null, null)),
            Ms = zs.exports,
            As = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-scenarios"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("div", {
                    staticClass: "row mb-3"
                }, [s("div", {
                    staticClass: "col-12 text-right"
                }, [s("b-button", {
                    staticClass: "mdi mdi-plus-circle-outline",
                    attrs: {
                        variant: "outline-primary"
                    },
                    on: {
                        click: function(t) {
                            return e.onEdit(null)
                        }
                    }
                }, [e._v(" " + e._s(e.$t("add")) + " ")])], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("b-table", {
                    attrs: {
                        items: e.scenariosList,
                        fields: e.scenariosFields,
                        hover: "",
                        striped: ""
                    },
                    scopedSlots: e._u([{
                        key: "cell(#)",
                        fn: function(t) {
                            return [e._v(" " + e._s(t.index + 1) + " ")]
                        }
                    }, {
                        key: "cell(action-btn)",
                        fn: function(t) {
                            return [s("b-button", {
                                staticClass: "mr-1 mdi mdi-pencil",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-success"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onEdit(t.item)
                                    }
                                }
                            }), s("div", {
                                staticClass: "delete-wrapp"
                            }, [s("b-button", {
                                staticClass: "mdi mdi-delete",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-danger"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onDelete(t.item)
                                    }
                                }
                            }), e.deleteScenario === t.item.guid ? s("div", {
                                staticClass: "confirm-delete shadow-lg"
                            }, [s("div", {
                                staticClass: "ttl mb-3 text-center small py-1"
                            }, [e._v(e._s(e.$t("confirm_delete")))]), s("div", {
                                staticClass: "row"
                            }, [s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-secondary btn-block",
                                on: {
                                    click: e.onCancelDelete
                                }
                            }, [e._v(e._s(e.$t("cancel")))])]), s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-danger btn-block",
                                on: {
                                    click: e.confirmDelete
                                }
                            }, [e._v(e._s(e.$t("delete")))])])])]) : e._e()], 1)]
                        }
                    }])
                })], 1)])])])
            },
            Is = [],
            Es = (s("c740"), {
                getList: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", C.getList());
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t() {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                get: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    if (!t) {
                                        e.next = 4;
                                        break
                                    }
                                    return e.abrupt("return", C.get(t));
                                case 4:
                                    return e.abrupt("return", {
                                        name: null,
                                        mode: void 0,
                                        conditionSets: []
                                    });
                                case 5:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                set: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", C.set(t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                del: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", C.destroy(t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                changeOrder: function(e) {
                    var t = {
                        guid: e.guid,
                        map: []
                    };
                    return e.conditionSets.forEach((function(e) {
                        t.map.push({
                            idx: e.idx,
                            guid: e.guid
                        })
                    })), C.changeConditionSetOrder(t)
                }
            }),
            Bs = {
                name: "Scenarios",
                data: function() {
                    return {
                        scenariosFields: ["#", {
                            key: "mode",
                            label: this.$t("mode")
                        }, {
                            key: "name",
                            label: this.$t("name")
                        }, {
                            key: "action-btn",
                            class: "action-btn text-right",
                            label: ""
                        }],
                        scenariosList: [],
                        scenarios: {},
                        deleteScenario: null
                    }
                },
                created: function() {
                    this.$store.commit("setPageTitle", this.$t("scenario_list")), this.getList()
                },
                methods: {
                    getList: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, Es.getList();
                                    case 2:
                                        e.scenariosList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onEdit: function(e) {
                        e ? this.$router.push({
                            name: "scenario-edit",
                            params: {
                                guid: e["guid"]
                            }
                        }) : this.$router.push({
                            name: "scenario-edit"
                        })
                    },
                    onClone: function(e) {
                        this.$msg.warning("Клонирование временно недоступно", this), console.log("Делаем копию сценария", e)
                    },
                    confirmDelete: function() {
                        var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                            var t, s, r = this;
                            return regeneratorRuntime.wrap((function(e) {
                                while (1) switch (e.prev = e.next) {
                                    case 0:
                                        return e.next = 2, Es.del(this.deleteScenario);
                                    case 2:
                                        t = e.sent, t.error || (s = this.scenariosList.findIndex((function(e) {
                                            return e.guid === r.deleteScenario
                                        })), this.scenariosList.splice(s, 1));
                                    case 4:
                                    case "end":
                                        return e.stop()
                                }
                            }), e, this)
                        })));

                        function t() {
                            return e.apply(this, arguments)
                        }
                        return t
                    }(),
                    onDelete: function(e) {
                        this.deleteScenario = e.guid
                    },
                    onCancelDelete: function() {
                        this.deleteScenario = null
                    }
                }
            },
            Hs = Bs,
            Vs = (s("5ef0"), Object(I["a"])(Hs, As, Is, !1, null, null, null)),
            Us = Vs.exports,
            qs = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-edit-scenario"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("div", {
                    staticClass: "row"
                }, [e.modeName ? s("div", {
                    staticClass: "col-12 mb-3"
                }, [e._v(" " + e._s(e.$t(e.scenario.mode)) + " " + e._s("(" + e.scenario.mode + ")") + " ")]) : e._e(), s("div", {
                    staticClass: "col-8"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-name"
                    }
                }, [e._v(e._s(e.$t("scenario_title")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.scenario.name,
                        expression: "scenario.name"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-name"
                    },
                    domProps: {
                        value: e.scenario.name
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.scenario, "name", t.target.value)
                        }
                    }
                })])]), e.modeTypes ? s("div", {
                    staticClass: "col-10 mb-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("choose_mode_type")))]), s("vue-multiselect", {
                    attrs: {
                        options: e.modeTypes,
                        "track-by": "value",
                        label: "text",
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: ""
                    },
                    on: {
                        close: function(t) {
                            e.scenario.mode = e.selectedScenarioType ? e.selectedScenarioType.value : null
                        }
                    },
                    scopedSlots: e._u([{
                        key: "singleLabel",
                        fn: function(t) {
                            var s = t.option;
                            return [e._v(" " + e._s(e.$t(s.value)) + " ")]
                        }
                    }, {
                        key: "option",
                        fn: function(t) {
                            var s = t.option;
                            return [e._v(" " + e._s(e.$t(s.value)) + " ")]
                        }
                    }], null, !1, 1773030166),
                    model: {
                        value: e.selectedScenarioType,
                        callback: function(t) {
                            e.selectedScenarioType = t
                        },
                        expression: "selectedScenarioType"
                    }
                })], 1)]) : e._e()]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 text-right"
                }, [e.scenario.mode && e.scenario.name ? s("b-button", {
                    staticClass: "mr-3",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: function(t) {
                            return e.onSaveScenario()
                        }
                    }
                }, [e._v(e._s(e.$t("save")) + " ")]) : e._e(), s("b-button", {
                    attrs: {
                        variant: "danger",
                        to: {
                            name: "scenarios"
                        }
                    }
                }, [e._v(e._s(e.$t("cancel")) + " ")])], 1)]), !1 === e.isNew ? s("hr") : e._e(), !1 === e.isNew ? s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 text-right"
                }, [s("b-button", {
                    staticClass: "mdi mdi-plus-circle-outline",
                    attrs: {
                        variant: "outline-primary"
                    },
                    on: {
                        click: function(t) {
                            return e.onEditCondition()
                        }
                    }
                }, [e._v(" " + e._s(e.$t("new_condition")) + " ")])], 1), e.scenario.conditionSets.length > 0 ? s("div", {
                    staticClass: "col-12 mt-3"
                }, [s("b-table", {
                    ref: "conditionSet",
                    attrs: {
                        id: "conditionSet",
                        items: e.scenario.conditionSets,
                        fields: e.conditionSetFields,
                        "sort-by": e.sortConditionsBy,
                        "sort-desc": e.sortConditionsDesc,
                        "tbody-transition-props": e.transProps,
                        "primary-key": "guid",
                        hover: "",
                        striped: ""
                    },
                    on: {
                        "update:sortBy": function(t) {
                            e.sortConditionsBy = t
                        },
                        "update:sort-by": function(t) {
                            e.sortConditionsBy = t
                        },
                        "update:sortDesc": function(t) {
                            e.sortConditionsDesc = t
                        },
                        "update:sort-desc": function(t) {
                            e.sortConditionsDesc = t
                        }
                    },
                    scopedSlots: e._u([{
                        key: "cell(idx-btn)",
                        fn: function(t) {
                            return [s("b-button", {
                                staticClass: "mr-1 mdi mdi-chevron-up",
                                class: {
                                    disabled: 0 === t.index
                                },
                                attrs: {
                                    size: "sm",
                                    variant: "outline-secondary"
                                },
                                on: {
                                    click: function(s) {
                                        return e.changeIdxCondition(t.index, "up")
                                    }
                                }
                            }), s("b-button", {
                                staticClass: "mdi mdi-chevron-down",
                                class: {
                                    disabled: t.index === e.scenario.conditionSets.length - 1
                                },
                                attrs: {
                                    size: "sm",
                                    variant: "outline-secondary"
                                },
                                on: {
                                    click: function(s) {
                                        return e.changeIdxCondition(t.index, "down")
                                    }
                                }
                            })]
                        }
                    }, {
                        key: "cell(name)",
                        fn: function(t) {
                            return [e._v(" " + e._s(t.item.name) + " ")]
                        }
                    }, {
                        key: "cell(action-btn)",
                        fn: function(t) {
                            return [s("b-button", {
                                staticClass: "mr-1 mdi mdi-pencil",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-success"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onEditCondition(t.item.guid)
                                    }
                                }
                            }), s("div", {
                                staticClass: "delete-wrapp"
                            }, [s("b-button", {
                                staticClass: "mdi mdi-delete",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-danger"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onDeleteCondition(t.item.guid)
                                    }
                                }
                            }), e.deleteConditions === t.item.guid ? s("div", {
                                staticClass: "confirm-delete shadow-lg"
                            }, [s("div", {
                                staticClass: "ttl mb-3 text-center small py-1"
                            }, [e._v(e._s(e.$t("confirm_delete")))]), s("div", {
                                staticClass: "row"
                            }, [s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-secondary btn-block",
                                on: {
                                    click: e.onCancelDelete
                                }
                            }, [e._v(e._s(e.$t("cancel")))])]), s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-danger btn-block",
                                on: {
                                    click: e.confirmDelete
                                }
                            }, [e._v(e._s(e.$t("delete")))])])])]) : e._e()], 1)]
                        }
                    }], null, !1, 2789624523)
                })], 1) : s("div", {
                    staticClass: "col-12 mt-3"
                }, [s("div", {
                    staticClass: "alert alert-warning",
                    attrs: {
                        role: "alert"
                    }
                }, [e._v(" " + e._s(e.$t("no_configured_conditions")) + "! ")])])]) : e._e()])])
            },
            Ws = [],
            Ys = {
                get: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    if (t) {
                                        e.next = 2;
                                        break
                                    }
                                    return e.abrupt("return", null);
                                case 2:
                                    return e.abrupt("return", y.get(t));
                                case 3:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                set: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", y.set(t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                destroy: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", y.destroy(t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getList: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t() {
                        return e.apply(this, arguments)
                    }
                    return t
                }()
            },
            Gs = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("vue-multiselect", e._g(e._b({
                    staticClass: "cm-cmp"
                }, "vue-multiselect", e.$attrs, !1), e.$listeners), [e._t("default")], 2)
            },
            Xs = [],
            Zs = s("a175"),
            Ks = {
                name: "CustomMultiselect",
                components: {
                    VueMultiselect: Zs["a"]
                }
            },
            Qs = Ks,
            Js = (s("56b3"), Object(I["a"])(Qs, Gs, Xs, !1, null, null, null)),
            er = Js.exports,
            tr = {
                name: "ScenarioEdit",
                components: {
                    CustomMultiselect: er,
                    VueMultiselect: Zs["a"]
                },
                data: function() {
                    return {
                        scenario: {
                            name: "",
                            mode: "",
                            conditionSets: []
                        },
                        selectedScenarioType: null,
                        isNew: !1,
                        modeTypes: null,
                        modeName: "",
                        sortConditionsBy: "idx",
                        sortConditionsDesc: !0,
                        transProps: {
                            name: "flip-list"
                        },
                        conditionSetFields: [{
                            key: "idx-btn",
                            class: "idx-btn text-left",
                            label: ""
                        }, {
                            key: "name",
                            label: this.$t("name")
                        }, {
                            key: "action-btn",
                            class: "action-btn text-right",
                            label: ""
                        }],
                        deleteConditions: null
                    }
                },
                watch: {
                    $route: function(e, t) {
                        this.onCreate()
                    }
                },
                created: function() {
                    this.$store.commit("setPageTitle", this.$t("scenario_editor")), this.onCreate()
                },
                methods: {
                    onCreate: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        if (!e.$route.params.guid) {
                                            t.next = 7;
                                            break
                                        }
                                        return e.isNew = !1, t.next = 4, e.getScenario();
                                    case 4:
                                        e.modeName = ne().stationModes.find((function(t) {
                                            return t.value === e.scenario.mode
                                        })).text, t.next = 10;
                                        break;
                                    case 7:
                                        return e.isNew = !0, t.next = 10, e.getModeTypes();
                                    case 10:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    getScenario: function() {
                        var e = arguments,
                            t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        return r = e.length > 0 && void 0 !== e[0] ? e[0] : t.$route.params.guid, s.next = 3, Es.get(r);
                                    case 3:
                                        t.scenario = s.sent;
                                    case 4:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    getModeTypes: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return s = ne().stationModes, t.next = 3, Es.getList();
                                    case 3:
                                        r = t.sent, s = s.map((function(e) {
                                            return e.disabled = !1, e.$isDisabled = !1, e
                                        })), r.forEach((function(e) {
                                            var t = s.findIndex((function(t) {
                                                return t.value === e.mode
                                            }));
                                            s[t].disabled = t >= 0, s[t].$isDisabled = t >= 0
                                        })), e.modeTypes = s;
                                    case 7:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onSaveScenario: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return s = {
                                            name: e.scenario.name,
                                            mode: e.scenario.mode,
                                            guid: e.scenario.guid ? e.scenario.guid : null
                                        }, t.next = 3, Es.set(s);
                                    case 3:
                                        r = t.sent, r.error ? e.$msg.error(r, e) : (e.$msg.success(e.$t("scenario_saved") + "!", e), e.isNew && (e.scenario.guid = r, e.$router.push({
                                            name: "scenario-edit",
                                            params: {
                                                guid: e.scenario.guid
                                            }
                                        })), e.changeConditionSetOrder());
                                    case 5:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onEditCondition: function() {
                        var e = arguments,
                            t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        r = e.length > 0 && void 0 !== e[0] ? e[0] : "new", t.$router.push({
                                            name: "condition-edit",
                                            params: {
                                                guid: r,
                                                scenarioGuid: t.scenario.guid
                                            }
                                        });
                                    case 2:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    changeIdxCondition: function(e, t) {
                        var s = this.$refs.conditionSet.computedItems,
                            r = s.length;
                        switch (t) {
                            case "up":
                                e > 0 && (s[e].idx++, s[e - 1].idx--);
                                break;
                            case "down":
                                e < r - 1 && (s[e].idx--, s[e + 1].idx++);
                                break
                        }
                    },
                    reorderConditionIdx: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r, n;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        for (s = e.$refs.conditionSet.computedItems, r = s.length, n = 0, r; r >= 1; r--) s[r - 1].idx = n, n++;
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    changeConditionSetOrder: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, Es.changeOrder(e.scenario);
                                    case 2:
                                        t.sent, e.$refs.conditionSet && e.$refs.conditionSet.refresh();
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    confirmDelete: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, Ys.destroy(e.deleteConditions);
                                    case 2:
                                        s = t.sent, s.error ? e.$msg.error(s, e) : (e.$msg.success(e.$t("deleted") + "!", e), r = e.scenario.conditionSets.findIndex((function(t) {
                                            return t.guid === e.deleteConditions
                                        })), r >= 0 && e.scenario.conditionSets.splice(r, 1), setTimeout((function() {
                                            e.reorderConditionIdx(), e.changeConditionSetOrder()
                                        }), 100));
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onDeleteCondition: function(e) {
                        this.deleteConditions = e
                    },
                    onCancelDelete: function() {
                        this.deleteConditions = null
                    }
                }
            },
            sr = tr,
            rr = (s("ca0f"), Object(I["a"])(sr, qs, Ws, !1, null, null, null)),
            nr = rr.exports,
            ar = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-modes"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("div", {
                    staticClass: "row mb-3"
                }, [s("div", {
                    staticClass: "col-12 text-right"
                }, [s("b-button", {
                    staticClass: "mdi mdi-plus-circle-outline",
                    attrs: {
                        variant: "outline-primary"
                    },
                    on: {
                        click: function(t) {
                            return e.onEdit(null)
                        }
                    }
                }, [e._v(" " + e._s(e.$t("new_mode")) + " ")])], 1)]), s("div", {
                    staticClass: "row"
                }, [e.modesList.length > 0 ? s("div", {
                    staticClass: "col-12"
                }, [s("b-table", {
                    attrs: {
                        items: e.modesList,
                        fields: e.modeFields,
                        hover: "",
                        striped: ""
                    },
                    scopedSlots: e._u([{
                        key: "cell(#)",
                        fn: function(t) {
                            return [e._v(" " + e._s(t.index + 1) + " ")]
                        }
                    }, {
                        key: "cell(text)",
                        fn: function(t) {
                            return [e._v(" " + e._s(e.$t(t.item.value)) + " "), s("br")]
                        }
                    }, {
                        key: "cell(action-btn)",
                        fn: function(t) {
                            return [s("b-button", {
                                staticClass: "mr-1 mdi mdi-pencil",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-success"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onEdit(t.item)
                                    }
                                }
                            }), s("b-button", {
                                staticClass: "mr-1 mdi mdi-content-copy",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-primary"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onClone(t.item)
                                    }
                                }
                            }), s("div", {
                                staticClass: "delete-wrapp"
                            }, [s("b-button", {
                                staticClass: "mdi mdi-delete",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-danger"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onDelete(t.item)
                                    }
                                }
                            }), e.confirmDeleteMode === t.item.guid ? s("div", {
                                staticClass: "confirm-delete shadow-lg"
                            }, [s("div", {
                                staticClass: "ttl mb-3 text-center small py-1"
                            }, [e._v(e._s(e.$t("confirm_delete")))]), s("div", {
                                staticClass: "row"
                            }, [s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-secondary btn-block",
                                on: {
                                    click: e.onCancelDelete
                                }
                            }, [e._v(e._s(e.$t("cancel")))])]), s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-danger btn-block",
                                on: {
                                    click: e.confirmDelete
                                }
                            }, [e._v(e._s(e.$t("delete")))])])])]) : e._e()], 1)]
                        }
                    }], null, !1, 173676795)
                })], 1) : s("div", {
                    staticClass: "col-12"
                }, [s("div", {
                    staticClass: "alert alert-warning",
                    attrs: {
                        role: "alert"
                    }
                }, [e._v(" " + e._s(e.$t("no_configured_operating_modes")) + " ")])])])])])
            },
            or = [],
            ir = {
                get: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s, r;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    if (t) {
                                        e.next = 4;
                                        break
                                    }
                                    s = {
                                        type: void 0,
                                        blocks: []
                                    }, e.next = 8;
                                    break;
                                case 4:
                                    return e.next = 6, x.get(t);
                                case 6:
                                    r = e.sent, s = {
                                        guid: r["guid"],
                                        type: r["mode"],
                                        blocks: r["skin"]
                                    };
                                case 8:
                                    return e.abrupt("return", s);
                                case 9:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                save: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return s = {
                                        guid: t.guid ? t.guid : null,
                                        type: t.type,
                                        block: []
                                    }, t.blocks.forEach((function(e) {
                                        var t = {
                                            name: e.name,
                                            id: e.id ? e.id : null,
                                            width: e.width,
                                            height: e.height,
                                            top: e.top,
                                            left: e.left,
                                            color: e.color
                                        };
                                        s.block.push(t)
                                    })), e.abrupt("return", x.update(s));
                                case 3:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getList: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                        var t, s, r;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return t = ne().stationModes, e.next = 3, x.getList();
                                case 3:
                                    return s = e.sent, r = [], s.forEach((function(e) {
                                        var s = t.findIndex((function(t) {
                                            return t.value === e.mode
                                        }));
                                        t[s].guid = e.guid, r.push(t[s])
                                    })), e.abrupt("return", r);
                                case 7:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t() {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                destroy: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", x.destroy(t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                getScreen: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", _.getScreen(t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }()
            },
            cr = {
                name: "Modes",
                data: function() {
                    return {
                        modeFields: ["#", {
                            key: "text",
                            label: this.$t("name")
                        }, {
                            key: "value",
                            label: this.$t("mode")
                        }, {
                            key: "action-btn",
                            class: "action-btn text-right",
                            label: ""
                        }],
                        modesList: [],
                        confirmDeleteMode: null
                    }
                },
                created: function() {
                    this.$store.commit("setPageTitle", this.$t("cash_desk_operating_modes")), this.getModeList()
                },
                methods: {
                    getModeList: function() {
                        var e = this;
                        ir.getList().then((function(t) {
                            e.modesList = t
                        }))
                    },
                    onEdit: function(e) {
                        e ? this.$router.push({
                            name: "mode-edit",
                            params: {
                                guid: e.guid
                            }
                        }) : this.$router.push({
                            name: "mode-edit"
                        })
                    },
                    onClone: function(e) {
                        e ? this.$router.push({
                            name: "mode-edit",
                            params: {
                                guid: e.guid,
                                clone: !0
                            }
                        }) : this.$router.push({
                            name: "mode-edit"
                        })
                    },
                    confirmDelete: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, ir.destroy(e.confirmDeleteMode);
                                    case 2:
                                        s = t.sent, s.error ? e.$msg.error(s, e) : (e.confirmDeleteMode = null, e.$msg.success(e.$t("deleted") + "!", e), e.getModeList());
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onDelete: function(e) {
                        this.confirmDeleteMode = e.guid
                    },
                    onCancelDelete: function() {
                        this.confirmDeleteMode = null
                    }
                }
            },
            lr = cr,
            ur = (s("1878"), Object(I["a"])(lr, ar, or, !1, null, null, null)),
            mr = ur.exports,
            dr = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-edit-mode"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("div", {
                    staticClass: "row mb-3"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("choose_mode_type")))]), s("vue-multiselect", {
                    attrs: {
                        options: e.modeTypes,
                        "track-by": "value",
                        label: "text",
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: ""
                    },
                    on: {
                        close: function(t) {
                            e.mode.type = e.selectedMode.value
                        }
                    },
                    scopedSlots: e._u([{
                        key: "singleLabel",
                        fn: function(t) {
                            var s = t.option;
                            return [e._v(" " + e._s(e.$t(s.value)) + " ")]
                        }
                    }, {
                        key: "option",
                        fn: function(t) {
                            var s = t.option;
                            return [e._v(" " + e._s(e.$t(s.value)) + " ")]
                        }
                    }]),
                    model: {
                        value: e.selectedMode,
                        callback: function(t) {
                            e.selectedMode = t
                        },
                        expression: "selectedMode"
                    }
                })], 1)])]), s("div", {
                    staticClass: "blocks mb-3"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-8"
                }, [e.updateZIndex ? s("div", {
                    staticClass: "mode-screen",
                    style: {
                        height: e.screen.height + "px"
                    },
                    attrs: {
                        id: "mode-screen"
                    }
                }, e._l(e.mode.blocks, (function(t, r) {
                    return s("div", {
                        key: r,
                        staticClass: "mode-screen-item",
                        class: {
                            active: t.active
                        },
                        style: {
                            width: t._width + "px",
                            height: t._height + "px",
                            top: t._top + "px",
                            left: t._left + "px",
                            "z-index": 300 - r,
                            background: t.color,
                            "border-color": t.color
                        },
                        on: {
                            click: function(t) {
                                return e.selectBlock(r)
                            }
                        }
                    }, [s("span", [e._v(e._s(t.name))])])
                })), 0) : e._e(), e.selectedBlock ? s("div", {
                    staticClass: "block-setting"
                }, [s("div", {
                    staticClass: "screen-size"
                }, [e._v(e._s(e.$t("screen_size")) + ": "), s("span", [e._v(e._s(e.screen.settingWidth) + " x " + e._s(e.screen.settingHeight))])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("label", [e._v(e._s(e.$t("block_name")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.selectedBlock.name,
                        expression: "selectedBlock.name"
                    }],
                    attrs: {
                        type: "text"
                    },
                    domProps: {
                        value: e.selectedBlock.name
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.selectedBlock, "name", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-3 col-sm-6"
                }, [s("label", [e._v(e._s(e.$t("width")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.selectedBlock.width,
                        expression: "selectedBlock.width"
                    }],
                    attrs: {
                        type: "number"
                    },
                    domProps: {
                        value: e.selectedBlock.width
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.selectedBlock, "width", t.target.value)
                        }
                    }
                })]), s("div", {
                    staticClass: "col-3 col-sm-6"
                }, [s("label", [e._v(e._s(e.$t("height")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.selectedBlock.height,
                        expression: "selectedBlock.height"
                    }],
                    attrs: {
                        type: "number"
                    },
                    domProps: {
                        value: e.selectedBlock.height
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.selectedBlock, "height", t.target.value)
                        }
                    }
                })]), s("div", {
                    staticClass: "col-3 col-sm-6"
                }, [s("label", [e._v(e._s(e.$t("сoordinate")) + " (left)")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.selectedBlock.left,
                        expression: "selectedBlock.left"
                    }],
                    attrs: {
                        type: "number"
                    },
                    domProps: {
                        value: e.selectedBlock.left
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.selectedBlock, "left", t.target.value)
                        }
                    }
                })]), s("div", {
                    staticClass: "col-3 col-sm-6"
                }, [s("label", [e._v(e._s(e.$t("сoordinate")) + " (top)")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.selectedBlock.top,
                        expression: "selectedBlock.top"
                    }],
                    attrs: {
                        type: "number"
                    },
                    domProps: {
                        value: e.selectedBlock.top
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.selectedBlock, "top", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 text-center"
                }, [s("b-button-group", [s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: e.$t("width") + " 100%",
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("width")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-reorder-horizontal"
                })]), s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: e.$t("height") + " 100%",
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("height")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-reorder-vertical"
                })]), s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: e.$t("press_left"),
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("left")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-format-horizontal-align-left"
                })]), s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: e.$t("press_right"),
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("right")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-format-horizontal-align-right"
                })]), s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: e.$t("press_to_the_top"),
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("top")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-format-vertical-align-top"
                })]), s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: e.$t("press_to_the_bottom"),
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("bottom")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-format-vertical-align-bottom"
                })]), s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: e.$t("in_the_center"),
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("center")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-plus-box-outline"
                })]), s("b-button", {
                    directives: [{
                        name: "b-tooltip",
                        rawName: "v-b-tooltip.hover.top",
                        modifiers: {
                            hover: !0,
                            top: !0
                        }
                    }],
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        title: "reset",
                        variant: "outline-secondary",
                        size: "xs"
                    },
                    on: {
                        click: function(t) {
                            return e.sizeAction("reset")
                        }
                    }
                }, [s("i", {
                    staticClass: "mdi mdi-backup-restore"
                })])], 1)], 1)])]) : s("div", {
                    staticClass: "alert alert-warning",
                    attrs: {
                        role: "alert"
                    }
                }, [e._v(" " + e._s(e.$t("no_block_selected")) + "! ")])]), s("div", {
                    staticClass: "col-4 blocks-list"
                }, [s("div", {
                    staticClass: "list-group"
                }, e._l(e.mode.blocks, (function(t, r) {
                    return s("sortable", {
                        key: r,
                        staticClass: "list-group",
                        attrs: {
                            index: r,
                            "drag-direction": "vertical",
                            "replace-direction": "vertical"
                        },
                        on: {
                            sortend: function(t) {
                                return e.sortend(t, e.mode.blocks)
                            },
                            sort: e.sorting
                        },
                        model: {
                            value: e.dragData,
                            callback: function(t) {
                                e.dragData = t
                            },
                            expression: "dragData"
                        }
                    }, [s("div", {
                        staticClass: "list-group-item list-group-item-action",
                        class: {
                            active: t.active
                        }
                    }, [s("span", {
                        staticClass: "block-name",
                        on: {
                            click: function(t) {
                                return e.selectBlock(r)
                            }
                        }
                    }, [e._v(e._s(t.name))]), s("span", {
                        staticClass: "btn-delete",
                        on: {
                            click: function(t) {
                                return e.deleteBlock(r)
                            }
                        }
                    }, [s("i", {
                        staticClass: "mdi mdi-close-circle"
                    })])])])
                })), 1), s("b-button", {
                    staticClass: "mt-2 btn-block",
                    attrs: {
                        variant: "info"
                    },
                    on: {
                        click: e.addBlock
                    }
                }, [e._v(e._s(e.$t("add_block")))])], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("b-button", {
                    staticClass: "float-right",
                    attrs: {
                        variant: "danger",
                        to: {
                            name: "modes"
                        }
                    }
                }, [e._v(e._s(e.$t("cancel")) + " ")]), s("b-button", {
                    staticClass: "float-right mr-3",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: function(t) {
                            return e.onSave()
                        }
                    }
                }, [e._v(e._s(e.$t("save")))])], 1)])])])
            },
            pr = [],
            fr = s("e546"),
            vr = s.n(fr),
            gr = {
                name: "ModeEdit",
                components: {
                    CustomMultiselect: er,
                    VueMultiselect: Zs["a"],
                    Sortable: vr.a
                },
                data: function() {
                    return {
                        updateZIndex: !0,
                        dragData: {},
                        mode: {
                            blocks: []
                        },
                        selectedBlock: null,
                        selectedMode: {
                            text: null,
                            value: null
                        },
                        screen: {
                            width: 0,
                            height: 0,
                            settingWidth: 0,
                            settingHeight: 0,
                            scaleX: 0,
                            scaleY: 0
                        },
                        settings: null,
                        colorList: ne().colorList,
                        modeTypes: []
                    }
                },
                watch: {
                    selectedBlock: {
                        handler: "recountBlock",
                        deep: !0
                    }
                },
                mounted: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, K();
                                case 2:
                                    return e.settings = t.sent, e.$store.commit("setPageTitle", e.$t("editor_mode")), t.next = 6, e.getModeScreenSize();
                                case 6:
                                    e.$nextTick((function() {
                                        this.get(this.$route.params), window.addEventListener("resize", this.getModeScreenSize), this.getModeTypes()
                                    }));
                                case 7:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    getModeTypes: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return s = ne().stationModes, t.next = 3, ir.getList();
                                    case 3:
                                        r = t.sent, r.forEach((function(t) {
                                            var r = s.findIndex((function(e) {
                                                return e.value === t.value
                                            }));
                                            s[r].disabled = !1, s[r].disabled = r >= 0 && s[r].value !== e.mode.type, s[r].$isDisabled = r >= 0 && s[r].value !== e.mode.type
                                        })), e.modeTypes = s;
                                    case 6:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    get: function(e) {
                        var t = this;
                        ir.get(e.guid).then((function(s) {
                            t.mode = s, e.clone && (t.mode.type = null, t.mode.guid = null), setTimeout((function() {
                                t.selectedMode = t.modeTypes.filter((function(e) {
                                    return e.value === t.mode.type
                                }))
                            }), 100), t.mode.blocks.forEach((function(e) {
                                t.recountBlock(e)
                            })), t.mode.blocks.length > 0 && t.selectBlock(0)
                        }))
                    },
                    onSave: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        if (e.mode.type) {
                                            t.next = 3;
                                            break
                                        }
                                        return e.$msg.error(e.$t("mode_type_not_selected"), e), t.abrupt("return");
                                    case 3:
                                        return t.next = 5, ir.save(e.mode);
                                    case 5:
                                        s = t.sent, s.error ? e.$msg.error(s, e) : e.$msg.success(e.$t("mode_saved"), e);
                                    case 7:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    addBlock: function() {
                        var e = {
                            name: this.$t("new_block") + "-" + (this.mode.blocks.length + 1),
                            width: 200,
                            height: 200,
                            top: 20 * this.mode.blocks.length,
                            left: 20 * this.mode.blocks.length,
                            color: this.colorList[this.mode.blocks.length].value
                        };
                        this.mode.blocks.push(e), this.selectBlock(this.mode.blocks.length - 1)
                    },
                    selectBlock: function(e) {
                        var t, s = this.mode.blocks[e],
                            r = Object(a["a"])(this.mode.blocks);
                        try {
                            for (r.s(); !(t = r.n()).done;) {
                                var n = t.value;
                                n.active = !1
                            }
                        } catch (o) {
                            r.e(o)
                        } finally {
                            r.f()
                        }
                        s.active = !0, this.$nextTick((function() {
                            this.getModeScreenSize(), s._width = s.width * this.screen.scaleX, s._height = s.height * this.screen.scaleY, s._top = s.top * this.screen.scaleY, s._left = s.left * this.screen.scaleX, this.selectedBlock = s
                        }))
                    },
                    deleteBlock: function(e) {
                        this.mode.blocks.splice(e, 1), this.mode.blocks.length <= 0 ? this.selectedBlock = null : this.selectBlock(0)
                    },
                    getModeScreenSize: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function e() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(e) {
                                while (1) switch (e.prev = e.next) {
                                    case 0:
                                        return s = document.getElementById("mode-screen"), e.next = 3, ir.getScreen(null);
                                    case 3:
                                        r = e.sent, t.screen.settingWidth = r.width, t.screen.settingHeight = r.height, t.screen.width = s.offsetWidth, t.screen.height = t.screen.settingHeight * t.screen.width / t.screen.settingWidth, t.screen.scaleY = t.screen.height / t.screen.settingHeight, t.screen.scaleX = t.screen.width / t.screen.settingWidth;
                                    case 10:
                                    case "end":
                                        return e.stop()
                                }
                            }), e)
                        })))()
                    },
                    recountBlock: function(e) {
                        var t = e || this.selectedBlock;
                        t && (t._width = t.width * this.screen.scaleX, t._height = t.height * this.screen.scaleY, t._top = t.top * this.screen.scaleY, t._left = t.left * this.screen.scaleX)
                    },
                    sizeAction: function(e) {
                        switch (e) {
                            case "left":
                                this.selectedBlock.left = 0;
                                break;
                            case "right":
                                this.selectedBlock.left = this.screen.settingWidth - this.selectedBlock.width;
                                break;
                            case "width":
                                this.selectedBlock.width = this.screen.settingWidth;
                                break;
                            case "height":
                                this.selectedBlock.height = this.screen.settingHeight;
                                break;
                            case "top":
                                this.selectedBlock.top = 0;
                                break;
                            case "bottom":
                                this.selectedBlock.top = this.screen.settingHeight - this.selectedBlock.height;
                                break;
                            case "center":
                                this.selectedBlock.top = this.screen.settingHeight / 2 - this.selectedBlock.height / 2, this.selectedBlock.left = this.screen.settingWidth / 2 - this.selectedBlock.width / 2;
                                break;
                            case "reset":
                                this.selectedBlock.top = 0, this.selectedBlock.left = 0, this.selectedBlock.width = 200, this.selectedBlock.height = 200;
                                break
                        }
                    },
                    sorting: function(e) {
                        e.oldIndex, e.newIndex
                    },
                    sortend: function(e, t) {
                        var s = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function r() {
                            var n, o;
                            return regeneratorRuntime.wrap((function(r) {
                                while (1) switch (r.prev = r.next) {
                                    case 0:
                                        return s.updateZIndex = !1, n = e.oldIndex, o = e.newIndex, r.next = 4, s.rearrange(t, n, o);
                                    case 4:
                                        s.$nextTick((function() {
                                            var e, t = Object(a["a"])(this.mode.blocks);
                                            try {
                                                for (t.s(); !(e = t.n()).done;) {
                                                    var s = e.value;
                                                    s.active = !1
                                                }
                                            } catch (r) {
                                                t.e(r)
                                            } finally {
                                                t.f()
                                            }
                                            this.selectedBlock = null, this.updateZIndex = !0
                                        }));
                                    case 5:
                                    case "end":
                                        return r.stop()
                                }
                            }), r)
                        })))()
                    },
                    rearrange: function(e, t, s) {
                        return Object(o["a"])(regeneratorRuntime.mark((function r() {
                            return regeneratorRuntime.wrap((function(r) {
                                while (1) switch (r.prev = r.next) {
                                    case 0:
                                        t > s ? (e.splice(s, 0, e[t]), e.splice(t + 1, 1)) : (e.splice(s + 1, 0, e[t]), e.splice(t, 1));
                                    case 1:
                                    case "end":
                                        return r.stop()
                                }
                            }), r)
                        })))()
                    }
                }
            },
            hr = gr,
            br = (s("09f6"), Object(I["a"])(hr, dr, pr, !1, null, null, null)),
            wr = br.exports,
            _r = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-scenes"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("div", {
                    staticClass: "row mb-3"
                }, [s("div", {
                    staticClass: "col-12 text-right"
                }, [s("b-button", {
                    staticClass: "mdi mdi-plus-circle-outline",
                    attrs: {
                        variant: "outline-primary"
                    },
                    on: {
                        click: function(t) {
                            return e.onEdit(null)
                        }
                    }
                }, [e._v(" " + e._s(e.$t("add")) + " ")])], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("b-table", {
                    attrs: {
                        items: e.scenesList,
                        fields: e.scenesFields,
                        hover: "",
                        striped: ""
                    },
                    scopedSlots: e._u([{
                        key: "cell(#)",
                        fn: function(t) {
                            return [e._v(" " + e._s(t.index + 1) + " ")]
                        }
                    }, {
                        key: "cell(type)",
                        fn: function(t) {
                            return [e._v(" " + e._s(e.$t(t.item.type)) + " ")]
                        }
                    }, {
                        key: "cell(action-btn)",
                        fn: function(t) {
                            return [s("b-button", {
                                staticClass: "mr-1 mdi mdi-pencil",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-success"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onEdit(t.item)
                                    }
                                }
                            }), s("div", {
                                staticClass: "delete-wrapp"
                            }, [s("b-button", {
                                staticClass: "mdi mdi-delete",
                                attrs: {
                                    size: "sm",
                                    variant: "outline-danger"
                                },
                                on: {
                                    click: function(s) {
                                        return e.onDelete(t.item)
                                    }
                                }
                            }), e.deleteScene === t.item.guid ? s("div", {
                                staticClass: "confirm-delete shadow-lg"
                            }, [s("div", {
                                staticClass: "ttl mb-3 text-center small py-1"
                            }, [e._v(e._s(e.$t("confirm_delete")))]), s("div", {
                                staticClass: "row"
                            }, [s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-secondary btn-block",
                                on: {
                                    click: e.onCancelDelete
                                }
                            }, [e._v(e._s(e.$t("cancel")))])]), s("div", {
                                staticClass: "col-sm-6"
                            }, [s("button", {
                                staticClass: "btn btn-outline-danger btn-block",
                                on: {
                                    click: e.confirmDelete
                                }
                            }, [e._v(e._s(e.$t("delete")))])])])]) : e._e()], 1)]
                        }
                    }])
                })], 1)])])])
            },
            xr = [],
            yr = {
                getList: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", k.getList());
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t() {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                get: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return e.abrupt("return", k.get(t));
                                case 1:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                set: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t, s, r) {
                        var n;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    if ("gallery" === t.type && (t.mappedScenes = [], s.frame.forEach((function(e) {
                                            e.guid && t.mappedScenes.push({
                                                guid: e.guid
                                            })
                                        }))), t.params = s, !r) {
                                        e.next = 13;
                                        break
                                    }
                                    return e.next = 5, this.uploadMedia(r);
                                case 5:
                                    if (n = e.sent, "OK" !== n) {
                                        e.next = 10;
                                        break
                                    }
                                    return e.abrupt("return", k.set(t));
                                case 10:
                                    return e.abrupt("return", n);
                                case 11:
                                    e.next = 14;
                                    break;
                                case 13:
                                    return e.abrupt("return", k.set(t));
                                case 14:
                                case "end":
                                    return e.stop()
                            }
                        }), e, this)
                    })));

                    function t(t, s, r) {
                        return e.apply(this, arguments)
                    }
                    return t
                }(),
                del: function(e) {
                    return k.destroy(e)
                },
                uploadMedia: function() {
                    var e = Object(o["a"])(regeneratorRuntime.mark((function e(t) {
                        var s;
                        return regeneratorRuntime.wrap((function(e) {
                            while (1) switch (e.prev = e.next) {
                                case 0:
                                    return s = {
                                        name: t.name,
                                        data: t.data
                                    }, e.abrupt("return", k.uploadMedia(s));
                                case 2:
                                case "end":
                                    return e.stop()
                            }
                        }), e)
                    })));

                    function t(t) {
                        return e.apply(this, arguments)
                    }
                    return t
                }()
            },
            Cr = {
                name: "Scenes",
                data: function() {
                    return {
                        scenesFields: ["#", {
                            key: "name",
                            label: this.$t("name")
                        }, {
                            key: "type",
                            label: this.$t("type")
                        }, {
                            key: "action-btn",
                            class: "action-btn text-right",
                            label: ""
                        }],
                        scenesList: [],
                        scenes: {},
                        sceneTypes: X.scenesTypeName,
                        deleteScene: null
                    }
                },
                created: function() {
                    this.$store.commit("setPageTitle", this.$t("scene_list")), this.getList()
                },
                methods: {
                    getList: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, yr.getList();
                                    case 2:
                                        e.scenesList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onEdit: function(e) {
                        e ? this.$router.push({
                            name: "scene-edit",
                            params: {
                                guid: e["guid"]
                            }
                        }) : this.$router.push({
                            name: "scene-edit"
                        })
                    },
                    confirmDelete: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, yr.del(e.deleteScene);
                                    case 2:
                                        s = t.sent, s.error ? e.$msg.error(s, e) : (e.$msg.success(e.$t("deleted") + "!", e), e.getList());
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onDelete: function(e) {
                        this.deleteScene = e.guid
                    },
                    onCancelDelete: function() {
                        this.deleteScene = null
                    }
                }
            },
            kr = Cr,
            Sr = (s("b7df"), Object(I["a"])(kr, _r, xr, !1, null, null, null)),
            $r = Sr.exports,
            Rr = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-edit-scene"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-name"
                    }
                }, [e._v(e._s(e.$t("scene_name")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.scene.name,
                        expression: "scene.name"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-name"
                    },
                    domProps: {
                        value: e.scene.name
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.scene, "name", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-6 mt-4"
                }, [s("b-button", {
                    staticClass: "float-right",
                    attrs: {
                        variant: "danger",
                        to: {
                            name: "scenes"
                        }
                    }
                }, [e._v(e._s(e.$t("cancel")) + " ")]), e.scene.type && e.scene.name && "custom" !== e.scene.type ? s("b-button", {
                    staticClass: "float-right mr-3",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: e.onSave
                    }
                }, [e._v(e._s(e.$t("save")) + " ")]) : e._e()], 1)]), e.scene.guid ? e._e() : s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-7"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("choose_a_scene_type")))]), s("vue-multiselect", {
                    attrs: {
                        options: e.sceneTypes,
                        "track-by": "value",
                        value: "",
                        label: "text",
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: ""
                    },
                    on: {
                        close: e.sceneTypeSelected
                    },
                    scopedSlots: e._u([{
                        key: "singleLabel",
                        fn: function(t) {
                            var s = t.option;
                            return [e._v(" " + e._s(e.$t(s.value)) + " ")]
                        }
                    }, {
                        key: "option",
                        fn: function(t) {
                            var s = t.option;
                            return [e._v(" " + e._s(e.$t(s.value)) + " ")]
                        }
                    }], null, !1, 1773030166),
                    model: {
                        value: e.selectedSceneType,
                        callback: function(t) {
                            e.selectedSceneType = t
                        },
                        expression: "selectedSceneType"
                    }
                })], 1)])]), "image" === e.scene.type ? s("image-scene", {
                    ref: "sceneItem"
                }) : e._e(), "text" === e.scene.type ? s("text-scene", {
                    ref: "sceneItem"
                }) : e._e(), "video" === e.scene.type ? s("video-scene", {
                    ref: "sceneItem"
                }) : e._e(), "check" === e.scene.type ? s("check-scene", {
                    ref: "sceneItem"
                }) : e._e(), "custom" === e.scene.type ? s("custom-scene", {
                    ref: "sceneItem"
                }) : e._e(), "gallery" === e.scene.type ? s("gallery-scene", {
                    ref: "sceneItem"
                }) : e._e(), "display" === e.scene.type ? s("display-scene", {
                    ref: "sceneItem"
                }) : e._e(), "qrCode" === e.scene.type ? s("qr-code-scene", {
                    ref: "sceneItem"
                }) : e._e(), "imageText" === e.scene.type ? s("image-text", {
                    ref: "sceneItem"
                }) : e._e(), "dishImage" === e.scene.type ? s("dish-image", {
                    ref: "sceneItem"
                }) : e._e(), "qualityService" === e.scene.type ? s("quality-service-scene", {
                    ref: "sceneItem"
                }) : e._e()], 1), e._v(" "), s("media-window", {
                    attrs: {
                        "scene-type": e.selectedSceneType
                    },
                    on: {
                        "select-image": e.selectImage,
                        "select-video": e.selectVideo
                    }
                })], 1)
            },
            jr = [],
            Tr = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-image mt-3"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-sm-8"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("b-button", {
                    directives: [{
                        name: "b-modal",
                        rawName: "v-b-modal.media-window",
                        modifiers: {
                            "media-window": !0
                        }
                    }],
                    attrs: {
                        size: "sm"
                    }
                }, [e._v(e._s(e.$t("select_image")))])], 1), s("div", {
                    staticClass: "col-sm-12 mt-2"
                }, [s("b-button", {
                    staticClass: "mr-2 text-light",
                    attrs: {
                        size: "sm",
                        variant: "warning"
                    },
                    on: {
                        click: e.clearFiles
                    }
                }, [e._v(e._s(e.$t("reset")))])], 1)])]), s("div", {
                    staticClass: "col-sm-4"
                }, [s("b-img", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: e.params.fileName,
                        expression: "params.fileName"
                    }],
                    attrs: {
                        src: "/media/" + e.uploadMediaFolder + "/" + e.params.fileName + "?t" + e.t,
                        "fluid-grow": "",
                        thumbnail: "",
                        liquid: "",
                        alt: ""
                    }
                })], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-image-width"
                    }
                }, [e._v(e._s(e.$t("width")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.width,
                        expression: "params.width"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-image-width",
                        disabled: e.params.full,
                        type: "number"
                    },
                    domProps: {
                        value: e.params.width
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "width", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-image-height"
                    }
                }, [e._v(e._s(e.$t("height")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.height,
                        expression: "params.height"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-image-height",
                        disabled: e.params.full,
                        type: "number"
                    },
                    domProps: {
                        value: e.params.height
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "height", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-7"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("alignment")
                    }
                }, [s("b-form-radio-group", {
                    staticClass: "mb-1",
                    attrs: {
                        disabled: e.params.full,
                        buttons: "",
                        "button-variant": "outline-info",
                        size: "sm",
                        options: e.align
                    },
                    model: {
                        value: e.params.align,
                        callback: function(t) {
                            e.$set(e.params, "align", t)
                        },
                        expression: "params.align"
                    }
                })], 1)], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-xs-12"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("stretch")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "fullScreen",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.full,
                        callback: function(t) {
                            e.$set(e.params, "full", t)
                        },
                        expression: "params.full"
                    }
                })], 1)], 1)])])
            },
            Or = [],
            Pr = {
                data: function() {
                    return {
                        uploadMediaFolder: me,
                        radioBoolOptions: [{
                            text: this.$t("yes"),
                            value: !0
                        }, {
                            text: this.$t("no"),
                            value: !1
                        }],
                        align: [{
                            text: this.$t("left"),
                            value: "left"
                        }, {
                            text: this.$t("in_the_center"),
                            value: "center"
                        }, {
                            text: this.$t("right"),
                            value: "right"
                        }],
                        blankImg: {
                            blank: !0,
                            blankColor: "#f6f6f6",
                            class: "m1"
                        },
                        params: {
                            width: null,
                            height: null,
                            align: "center",
                            full: !0,
                            fileName: ""
                        }
                    }
                },
                computed: {
                    t: function() {
                        return Date.now()
                    }
                },
                methods: {
                    onSelectImage: function(e) {
                        this.params.fileName = e
                    },
                    clearFiles: function() {
                        this.params.fileName = ""
                    }
                }
            },
            Nr = Pr,
            Lr = Object(I["a"])(Nr, Tr, Or, !1, null, null, null),
            Dr = Lr.exports,
            Fr = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-text"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-sm-8"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-text"
                    }
                }, [e._v(e._s(e.$t("text")))]), s("textarea", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text,
                        expression: "params.text"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-text",
                        rows: "5"
                    },
                    domProps: {
                        value: e.params.text
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "text", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.font,
                        callback: function(t) {
                            e.$set(e.params, "font", t)
                        },
                        expression: "params.font"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.size,
                        expression: "params.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "size", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("label", {
                    attrs: {
                        for: "color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.color,
                                    callback: function(t) {
                                        e.$set(e.params, "color", t)
                                    },
                                    expression: "params.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.color,
                        expression: "params.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-8"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("alignment")
                    }
                }, [s("b-form-radio-group", {
                    staticClass: "mb-1",
                    attrs: {
                        buttons: "",
                        "button-variant": "outline-info",
                        size: "sm",
                        options: e.align
                    },
                    model: {
                        value: e.params.align,
                        callback: function(t) {
                            e.$set(e.params, "align", t)
                        },
                        expression: "params.align"
                    }
                })], 1)], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("label", {
                    attrs: {
                        for: "background"
                    }
                }, [e._v(e._s(e.$t("bg_color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.background
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    value: e.params.background,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.background,
                                    callback: function(t) {
                                        e.$set(e.params, "background", t)
                                    },
                                    expression: "params.background"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.background,
                        expression: "params.background"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "background",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.background
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "background", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-lh"
                    }
                }, [e._v(e._s(e.$t("lineHeight")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.lineHeight,
                        expression: "params.lineHeight"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-lh",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.lineHeight
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "lineHeight", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("ul", {
                    staticClass: "shortcode-helper"
                }, [s("li"), s("li", [s("span", [e._v("{currencySymbol}")]), e._v(" - " + e._s(e.$t("currency_symbol")))]), s("li", [s("span", [e._v("{orderSum}")]), e._v(" - " + e._s(e.$t("order_price")))]), s("li", [s("span", [e._v("{orderName}")]), e._v(" - " + e._s(e.$t("order_name")))]), s("li", [s("span", [e._v("{unpaidSum}")]), e._v(" - " + e._s(e.$t("amount_to_be_paid")))]), s("li", [s("span", [e._v("{paid}")]), e._v(" - " + e._s(e.$t("paid")))]), s("li", [s("span", [e._v("{surrender}")]), e._v(" - " + e._s(e.$t("surrender")))]), s("li", [s("span", [e._v("{discountSum}")]), e._v(" - " + e._s(e.$t("discount_amount")))]), s("li", [s("span", [e._v("{totalPieces}")]), e._v(" - " + e._s(e.$t("number_of_items")))]), s("li", [s("span", [e._v("{role}")]), e._v(" - " + e._s(e.$t("authorized_post_office")))]), s("li", [s("span", [e._v("{name}")]), e._v(" - " + e._s(e.$t("authorized_name")))]), s("li", [s("span", [e._v("{dishPrice:1234}")]), e._v(" - " + e._s(e.$t("price_of_dish_dish_code")))]), s("li", [s("span", [e._v("{dishName:1234}")]), e._v(" - " + e._s(e.$t("name_of_dish_dish_code")))])])])])])
            },
            zr = [],
            Mr = s("36fc"),
            Ar = (s("bbb4"), {
                components: {
                    CustomMultiselect: er,
                    verte: Mr["a"]
                },
                data: function() {
                    return {
                        align: [{
                            text: this.$t("left"),
                            value: "left"
                        }, {
                            text: this.$t("in_the_center"),
                            value: "center"
                        }, {
                            text: this.$t("right"),
                            value: "right"
                        }],
                        params: {
                            text: "",
                            font: "Verdana",
                            size: 14,
                            align: "left",
                            color: "#000000",
                            background: "transperent",
                            lineHeight: 1.2
                        },
                        fontList: ["Verdana", "Roboto", "Arial"]
                    }
                },
                created: function() {
                    this.getFonts()
                },
                methods: {
                    getFonts: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.fontList();
                                    case 2:
                                        e.fontList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    }
                }
            }),
            Ir = Ar,
            Er = (s("cb66"), Object(I["a"])(Ir, Fr, zr, !1, null, null, null)),
            Br = Er.exports,
            Hr = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-video mt-3"
                }, [s("div", {
                    staticClass: "row mb-3"
                }, [s("div", {
                    staticClass: "col-sm-8"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("b-button", {
                    directives: [{
                        name: "b-modal",
                        rawName: "v-b-modal.media-window",
                        modifiers: {
                            "media-window": !0
                        }
                    }],
                    attrs: {
                        size: "sm"
                    }
                }, [e._v(e._s(e.$t("select_video")))])], 1), s("div", {
                    staticClass: "col-sm-6"
                }, [s("b-button", {
                    staticClass: "mr-2 text-light",
                    attrs: {
                        size: "sm",
                        variant: "warning"
                    },
                    on: {
                        click: e.clearFiles
                    }
                }, [e._v(e._s(e.$t("reset")))])], 1)])])]), e.params.fileName ? s("div", {
                    staticClass: "row mb-3"
                }, [s("div", {
                    staticClass: "col-sm-12 offset-md-1 col-md-10 offset-lg-3 col-lg-6 text-center"
                }, [s("video", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: null !== e.params.fileName,
                        expression: "params.fileName !== null"
                    }],
                    staticClass: "embed-responsive-item",
                    style: {
                        width: "100%",
                        "max-height": "500px",
                        background: e.params.background
                    },
                    attrs: {
                        controls: e.params.controls,
                        loop: e.params.loop,
                        autoplay: e.params.autoplay,
                        preload: "auto",
                        src: e.getVid()
                    },
                    domProps: {
                        muted: e.params.muted
                    }
                })])]) : e._e(), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-3 col-xs-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("controls")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "controls",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.controls,
                        callback: function(t) {
                            e.$set(e.params, "controls", t)
                        },
                        expression: "params.controls"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-md-3 col-xs-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("muted")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "muted",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.muted,
                        callback: function(t) {
                            e.$set(e.params, "muted", t)
                        },
                        expression: "params.muted"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-md-3 col-xs-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("loop")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "loop",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.loop,
                        callback: function(t) {
                            e.$set(e.params, "loop", t)
                        },
                        expression: "params.loop"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-md-3 col-xs-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("autoplay")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "autoplay",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.autoplay,
                        callback: function(t) {
                            e.$set(e.params, "autoplay", t)
                        },
                        expression: "params.autoplay"
                    }
                })], 1)], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("label", {
                    attrs: {
                        for: "color"
                    }
                }, [e._v(e._s(e.$t("bg_color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.background
                                },
                                attrs: {
                                    "menu-position": "center",
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.background,
                                    callback: function(t) {
                                        e.$set(e.params, "background", t)
                                    },
                                    expression: "params.background"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.background,
                        expression: "params.background"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.background
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "background", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-md-3 col-xs-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("stretch")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "autoplay",
                        size: "sm",
                        options: e.radioContainType,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.contain,
                        callback: function(t) {
                            e.$set(e.params, "contain", t)
                        },
                        expression: "params.contain"
                    }
                })], 1)], 1)])])
            },
            Vr = [],
            Ur = {
                components: {
                    verte: Mr["a"]
                },
                data: function() {
                    return {
                        videoFolder: pe,
                        blankImg: {
                            blank: !0,
                            blankColor: "#f6f6f6",
                            class: "m1"
                        },
                        params: {
                            fileName: null,
                            controls: !0,
                            muted: !0,
                            preload: !0,
                            loop: !0,
                            autoplay: !0,
                            background: "#000000",
                            contain: "width"
                        },
                        radioBoolOptions: [{
                            text: this.$t("yes"),
                            value: !0
                        }, {
                            text: this.$t("no"),
                            value: !1
                        }],
                        radioContainType: [{
                            text: this.$t("width"),
                            value: "width"
                        }, {
                            text: this.$t("height"),
                            value: "height"
                        }]
                    }
                },
                computed: {
                    t: function() {
                        return Date.now()
                    }
                },
                watch: {
                    params: {
                        handler: "getVid",
                        deep: !0
                    }
                },
                methods: {
                    clearFiles: function() {
                        this.params.fileName = null
                    },
                    onSelectVideo: function(e) {
                        this.params.fileName = e
                    },
                    getVid: function() {
                        if (this.params.fileName) return "/media/".concat(pe, "/").concat(this.params.fileName, "?t=").concat(this.t)
                    }
                }
            },
            qr = Ur,
            Wr = Object(I["a"])(qr, Hr, Vr, !1, null, null, null),
            Yr = Wr.exports,
            Gr = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-check mt-3"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("show_modifiers")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "fullScreen",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.showModi,
                        callback: function(t) {
                            e.$set(e.params, "showModi", t)
                        },
                        expression: "params.showModi"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("display_dish_images")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "showDishImg",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.showDishImg,
                        callback: function(t) {
                            e.$set(e.params, "showDishImg", t)
                        },
                        expression: "params.showDishImg"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("showZeroCountComboComponents")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "showZeroCountComboComponents",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.showZeroCountComboComponents,
                        callback: function(t) {
                            e.$set(e.params, "showZeroCountComboComponents", t)
                        },
                        expression: "params.showZeroCountComboComponents"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("showZeroCountModifiers")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "showZeroCountModifiers",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.showZeroCountModifiers,
                        callback: function(t) {
                            e.$set(e.params, "showZeroCountModifiers", t)
                        },
                        expression: "params.showZeroCountModifiers"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("showPriceOfWeightDishes")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "showPriceOfWeightDishes",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.showPriceOfWeightDishes,
                        callback: function(t) {
                            e.$set(e.params, "showPriceOfWeightDishes", t)
                        },
                        expression: "params.showPriceOfWeightDishes"
                    }
                })], 1)], 1)]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-1 ttl"
                }, [e._v(e._s(e.$t("scenesTplCheck.dish")))]), s("div", {
                    staticClass: "col-4"
                }, [e.params ? s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        id: "dish-font",
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.dish.font,
                        callback: function(t) {
                            e.$set(e.params.dish, "font", t)
                        },
                        expression: "params.dish.font"
                    }
                })], 1) : e._e()]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "dish-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.dish.size,
                        expression: "params.dish.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "dish-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.dish.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.dish, "size", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "dish-color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.dish.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.dish.color,
                                    callback: function(t) {
                                        e.$set(e.params.dish, "color", t)
                                    },
                                    expression: "params.dish.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.dish.color,
                        expression: "params.dish.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "dish-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.dish.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.dish, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-3"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("bold")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.dish.bold,
                        callback: function(t) {
                            e.$set(e.params.dish, "bold", t)
                        },
                        expression: "params.dish.bold"
                    }
                })], 1)], 1)]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-1 ttl"
                }, [e._v(e._s(e.$t("scenesTplCheck.combo")))]), s("div", {
                    staticClass: "col-4"
                }, [e.params ? s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        id: "combo-font",
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.combo.font,
                        callback: function(t) {
                            e.$set(e.params.combo, "font", t)
                        },
                        expression: "params.combo.font"
                    }
                })], 1) : e._e()]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "combo-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.combo.size,
                        expression: "params.combo.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "combo-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.combo.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.combo, "size", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "combo-color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.combo.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.combo.color,
                                    callback: function(t) {
                                        e.$set(e.params.combo, "color", t)
                                    },
                                    expression: "params.combo.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.combo.color,
                        expression: "params.combo.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "combo-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.combo.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.combo, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-3"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("bold")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.combo.bold,
                        callback: function(t) {
                            e.$set(e.params.combo, "bold", t)
                        },
                        expression: "params.combo.bold"
                    }
                })], 1)], 1)]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-1 ttl"
                }, [e._v(e._s(e.$t("scenesTplCheck.modifier")))]), s("div", {
                    staticClass: "col-4"
                }, [e.params ? s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        id: "modi-font",
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.modi.font,
                        callback: function(t) {
                            e.$set(e.params.modi, "font", t)
                        },
                        expression: "params.modi.font"
                    }
                })], 1) : e._e()]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "modi-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.modi.size,
                        expression: "params.modi.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "modi-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.modi.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.modi, "size", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "modi-color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.modi.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.modi.color,
                                    callback: function(t) {
                                        e.$set(e.params.modi, "color", t)
                                    },
                                    expression: "params.modi.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.modi.color,
                        expression: "params.modi.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "modi-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.modi.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.modi, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-3"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("bold")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.modi.bold,
                        callback: function(t) {
                            e.$set(e.params.modi, "bold", t)
                        },
                        expression: "params.modi.bold"
                    }
                })], 1)], 1)]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-1 ttl"
                }, [e._v(e._s(e.$t("scenesTplCheck.price")))]), s("div", {
                    staticClass: "col-4"
                }, [e.params ? s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        id: "price-font",
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.price.font,
                        callback: function(t) {
                            e.$set(e.params.price, "font", t)
                        },
                        expression: "params.price.font"
                    }
                })], 1) : e._e()]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "price-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.price.size,
                        expression: "params.price.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "price-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.price.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.price, "size", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "price-color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.price.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.price.color,
                                    callback: function(t) {
                                        e.$set(e.params.price, "color", t)
                                    },
                                    expression: "params.price.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.price.color,
                        expression: "params.price.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "price-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.price.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.price, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-3"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("bold")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.price.bold,
                        callback: function(t) {
                            e.$set(e.params.price, "bold", t)
                        },
                        expression: "params.price.bold"
                    }
                })], 1)], 1)]), "bk" === e.themeName || "bkd" === e.themeName ? ["bk" === e.themeName ? s("div", [s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-1 ttl"
                }, [e._v("Округление")]), s("div", {
                    staticClass: "col-4"
                }, [e.params ? s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        id: "rounding-font",
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.rounding.font,
                        callback: function(t) {
                            e.$set(e.params.rounding, "font", t)
                        },
                        expression: "params.rounding.font"
                    }
                })], 1) : e._e()]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "price-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.rounding.size,
                        expression: "params.rounding.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "rounding-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.rounding.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.rounding, "size", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "rounding-color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.rounding.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.rounding.color,
                                    callback: function(t) {
                                        e.$set(e.params.rounding, "color", t)
                                    },
                                    expression: "params.rounding.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }], null, !1, 1511450504)
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.rounding.color,
                        expression: "params.rounding.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "rounding-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.rounding.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.rounding, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-3"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("bold")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.rounding.bold,
                        callback: function(t) {
                            e.$set(e.params.rounding, "bold", t)
                        },
                        expression: "params.rounding.bold"
                    }
                })], 1)], 1)])]) : e._e(), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-1 ttl"
                }, [e._v("Количество")]), s("div", {
                    staticClass: "col-4"
                }, [e.params ? s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        id: "count-font",
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.count.font,
                        callback: function(t) {
                            e.$set(e.params.count, "font", t)
                        },
                        expression: "params.count.font"
                    }
                })], 1) : e._e()]), s("div", {
                    staticClass: "col-2"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "price-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.count.size,
                        expression: "params.count.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "count-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.count.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.count, "size", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "count-color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.count.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.count.color,
                                    callback: function(t) {
                                        e.$set(e.params.count, "color", t)
                                    },
                                    expression: "params.count.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }], null, !1, 2861040104)
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.count.color,
                        expression: "params.count.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "count-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.count.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.count, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-3"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("bold")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.count.bold,
                        callback: function(t) {
                            e.$set(e.params.count, "bold", t)
                        },
                        expression: "params.count.bold"
                    }
                })], 1)], 1)]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-1 ttl"
                }, [e._v("Другое")]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "col-color"
                    }
                }, [e._v("Цвет названий столбцов в чеке")]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.other.colNameColor
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.other.colNameColor,
                                    callback: function(t) {
                                        e.$set(e.params.other, "colNameColor", t)
                                    },
                                    expression: "params.other.colNameColor"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }], null, !1, 3459759240)
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.other.colNameColor,
                        expression: "params.other.colNameColor"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "col-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.other.colNameColor
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.other, "colNameColor", t.target.value)
                        }
                    }
                })])], 1)])] : e._e()], 2)
            },
            Xr = [],
            Zr = (s("498a"), {
                components: {
                    CustomMultiselect: er,
                    verte: Mr["a"]
                },
                data: function() {
                    return {
                        loaded: !1,
                        params: {
                            showModi: !1,
                            showDishImg: !0,
                            showZeroCountComboComponents: !1,
                            showZeroCountModifiers: !1,
                            price: {
                                size: 14,
                                color: "#f00",
                                bold: !1,
                                font: "Verdana"
                            },
                            dish: {
                                size: 14,
                                color: "#52ff5c",
                                bold: !1,
                                font: "Verdana"
                            },
                            modi: {
                                size: 14,
                                color: "#0079ff",
                                bold: !1,
                                font: "Verdana"
                            },
                            combo: {
                                size: 14,
                                color: "#ff00e7",
                                bold: !1,
                                font: "Verdana"
                            },
                            count: {
                                size: 14,
                                color: "#ff0010",
                                bold: !1,
                                font: "Verdana"
                            },
                            rounding: {
                                size: 14,
                                color: "#ff8b12",
                                bold: !1,
                                font: "Verdana"
                            },
                            other: {
                                colNameColor: ""
                            }
                        },
                        radioBoolOptions: [{
                            text: this.$t("yes"),
                            value: !0
                        }, {
                            text: this.$t("no"),
                            value: !1
                        }],
                        fontList: ["Verdana", "Tahoma", "Segoe UI", "Arial", "Arial Black", "Impact"]
                    }
                },
                computed: {
                    themeName: function() {
                        return "theme ".trim()
                    }
                },
                created: function() {
                    this.getFonts()
                },
                methods: {
                    getFonts: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.fontList();
                                    case 2:
                                        e.fontList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    }
                }
            }),
            Kr = Zr,
            Qr = (s("f96a"), Object(I["a"])(Kr, Gr, Xr, !1, null, null, null)),
            Jr = Qr.exports,
            en = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-custom"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-1"
                }), s("div", {
                    staticClass: "col-10"
                }, [s("div", {
                    staticClass: "alert alert-primary  text-center text-info mt-5",
                    attrs: {
                        role: "alert"
                    }
                }, [s("b-spinner", {
                    staticStyle: {
                        width: "1.5em",
                        height: "1.5em"
                    },
                    attrs: {
                        variant: "light",
                        label: "Spinning"
                    }
                }), s("span", {
                    staticClass: "mx-3"
                }, [e._v("🛠 Скоро!")]), s("b-spinner", {
                    staticStyle: {
                        width: "1.5em",
                        height: "1.5em"
                    },
                    attrs: {
                        variant: "light",
                        label: "Spinning"
                    }
                })], 1)])])])
            },
            tn = [],
            sn = {},
            rn = Object(I["a"])(sn, en, tn, !1, null, null, null),
            nn = rn.exports,
            an = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-gallery"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-sm-8"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-check-size"
                    }
                }, [e._v(e._s(e.$t("interval")) + " (с)")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.interval,
                        expression: "params.interval"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-check-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.interval
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "interval", t.target.value)
                        }
                    }
                })])])]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-sm-6 mb-3"
                }, [s("b-button", {
                    directives: [{
                        name: "b-modal",
                        rawName: "v-b-modal.media-window",
                        modifiers: {
                            "media-window": !0
                        }
                    }],
                    attrs: {
                        size: "sm"
                    }
                }, [e._v(e._s(e.$t("add_media")))])], 1), s("div", {
                    staticClass: "col-sm-6 mb-3"
                }, [s("b-button", {
                    directives: [{
                        name: "b-modal",
                        rawName: "v-b-modal.scenes-window",
                        modifiers: {
                            "scenes-window": !0
                        }
                    }],
                    attrs: {
                        size: "sm"
                    }
                }, [e._v(e._s(e.$t("add_scene")))])], 1)]), s("div", {
                    staticClass: "row img-list"
                }, e._l(e.params.frame, (function(t, r) {
                    return s("sortable", {
                        key: r,
                        staticClass: "sorted-img-block col-sm-3 mb-3",
                        attrs: {
                            index: r,
                            "replace-direction": "horizontal"
                        },
                        on: {
                            sortend: function(t) {
                                return e.sortend(t, e.params.frame)
                            },
                            sort: e.sorting
                        },
                        model: {
                            value: e.dragData,
                            callback: function(t) {
                                e.dragData = t
                            },
                            expression: "dragData"
                        }
                    }, ["image" === t.type ? s("div", {
                        staticClass: "sorted-img  shadow-sm",
                        style: {
                            "background-image": e.getImagePath(t.name)
                        }
                    }) : e._e(), "video" === t.type ? s("div", {
                        staticClass: "sorted-img  shadow-sm"
                    }, [s("video", {
                        staticClass: "embed-responsive-item",
                        style: {
                            width: "100%",
                            "max-height": "500px",
                            background: "#000"
                        },
                        attrs: {
                            controls: !1,
                            loop: !0,
                            autoplay: !0,
                            preload: "auto",
                            src: e.getVid(t.name)
                        },
                        domProps: {
                            muted: !0
                        }
                    })]) : e._e(), "imageText" === t.type ? s("div", {
                        staticClass: "sorted-img  type-image-text shadow-sm"
                    }, [s("b", [e._v(e._s(e.$t("scene")) + ":")]), s("br"), s("br"), e._v(" " + e._s(t.name) + " ")]) : e._e(), s("b-badge", {
                        staticClass: "remove",
                        attrs: {
                            variant: "danger"
                        },
                        on: {
                            click: function(t) {
                                return e.removeImage(r)
                            }
                        }
                    }, [s("i", {
                        staticClass: "mdi mdi-close"
                    })])], 1)
                })), 1), s("b-modal", {
                    ref: "scenes-window",
                    attrs: {
                        id: "scenes-window",
                        title: e.$t("scenes"),
                        "hide-footer": ""
                    },
                    on: {
                        show: e.getSceneList
                    }
                }, [s("ul", {
                    staticClass: "scene-selector"
                }, e._l(e.scenesList, (function(t, r) {
                    return s("li", {
                        key: r,
                        staticClass: "shadow-sm",
                        on: {
                            click: function(s) {
                                return e.onSelectScene(t)
                            }
                        }
                    }, [e._v(" " + e._s(t.name) + " ")])
                })), 0), e.scenesList.length < 1 ? s("div", {
                    staticClass: "text-muted text-center"
                }, [e._v(" " + e._s(e.$t("scene_not_found")) + " ")]) : e._e(), s("hr"), s("div", {
                    staticClass: "mt-3 text-right"
                }, [s("b-button", {
                    on: {
                        click: e.hideModal
                    }
                }, [e._v(e._s(e.$t("close")))])], 1)])], 1)
            },
            on = [],
            cn = {
                name: "Gal",
                components: {
                    Sortable: vr.a
                },
                data: function() {
                    return {
                        dragData: {},
                        uploadMediaFolder: me,
                        scenesList: [],
                        params: {
                            frame: [],
                            interval: 5
                        }
                    }
                },
                computed: {
                    t: function() {
                        return Date.now()
                    }
                },
                methods: {
                    getImagePath: function(e) {
                        return ' url("/media/' + me + "/" + e + "?t=" + this.t + '")'
                    },
                    getVid: function(e) {
                        return "/media/".concat(pe, "/").concat(e, "?t=").concat(this.t)
                    },
                    onUpdate: function(e) {
                        this.list.splice(e.newIndex, 0, this.list.splice(e.oldIndex, 1)[0])
                    },
                    onSelectImage: function(e) {
                        var t = {
                            type: "image",
                            name: e
                        };
                        this.params.frame.push(t)
                    },
                    onSelectVideo: function(e) {
                        var t = {
                            type: "video",
                            name: e
                        };
                        this.params.frame.push(t)
                    },
                    onSelectScene: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        t.params.frame.push(e), t.hideModal();
                                    case 2:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    hideModal: function() {
                        this.$refs["scenes-window"].hide()
                    },
                    removeImage: function(e) {
                        this.params.frame.splice(e, 1)
                    },
                    sorting: function(e) {
                        e.oldIndex, e.newIndex
                    },
                    sortend: function(e, t) {
                        var s = e.oldIndex,
                            r = e.newIndex;
                        this.rearrange(t, s, r)
                    },
                    rearrange: function(e, t, s) {
                        t > s ? (e.splice(s, 0, e[t]), e.splice(t + 1, 1)) : (e.splice(s + 1, 0, e[t]), e.splice(t, 1))
                    },
                    getSceneList: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, yr.getList();
                                    case 2:
                                        e.scenesList = t.sent, e.scenesList = e.scenesList.filter((function(e) {
                                            return "imageText" === e.type
                                        }));
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    }
                }
            },
            ln = cn,
            un = (s("c41e"), Object(I["a"])(ln, an, on, !1, null, "0e11de39", null)),
            mn = un.exports,
            dn = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-display"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        id: "scene-check-font",
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.font,
                        callback: function(t) {
                            e.$set(e.params, "font", t)
                        },
                        expression: "params.font"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-3"
                }, [s("label", {
                    attrs: {
                        for: "price-color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.color
                                },
                                attrs: {
                                    menuPosition: "center",
                                    enableAlpha: !1,
                                    rgbSliders: !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.color,
                                    callback: function(t) {
                                        e.$set(e.params, "color", t)
                                    },
                                    expression: "params.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.color,
                        expression: "params.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "price-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "color", t.target.value)
                        }
                    }
                })])], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-5 col-xs-12"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("show_modifiers")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "fullScreen",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.showModi,
                        callback: function(t) {
                            e.$set(e.params, "showModi", t)
                        },
                        expression: "params.showModi"
                    }
                })], 1)], 1)])])
            },
            pn = [],
            fn = {
                components: {
                    CustomMultiselect: er,
                    verte: Mr["a"]
                },
                data: function() {
                    return {
                        params: {
                            showModi: !1,
                            font: "Verdana",
                            size: 14,
                            color: "#7e4a12"
                        },
                        radioBoolOptions: [{
                            text: this.$t("yes"),
                            value: !0
                        }, {
                            text: this.$t("no"),
                            value: !1
                        }],
                        fontList: ["Verdana", "Tahoma", "Segoe UI", "Arial", "Arial Black", "Impact"]
                    }
                },
                created: function() {
                    this.getFonts()
                },
                methods: {
                    getFonts: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.fontList();
                                    case 2:
                                        e.fontList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    }
                }
            },
            vn = fn,
            gn = Object(I["a"])(vn, dn, pn, !1, null, null, null),
            hn = gn.exports,
            bn = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-qrCode"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-1"
                }), s("div", {
                    staticClass: "col-10"
                }, [s("div", {
                    staticClass: "alert alert-primary  text-center text-info mt-5",
                    attrs: {
                        role: "alert"
                    }
                }, [s("b-spinner", {
                    staticStyle: {
                        width: "1.5em",
                        height: "1.5em"
                    },
                    attrs: {
                        variant: "light",
                        label: "Spinning"
                    }
                }), s("span", {
                    staticClass: "mx-3"
                }, [e._v("🛠 Скоро!")]), s("b-spinner", {
                    staticStyle: {
                        width: "1.5em",
                        height: "1.5em"
                    },
                    attrs: {
                        variant: "light",
                        label: "Spinning"
                    }
                })], 1)])])])
            },
            wn = [],
            _n = {
                data: function() {
                    return {
                        align: [{
                            text: this.$t("left"),
                            value: "left"
                        }, {
                            text: this.$t("in_the_center"),
                            value: "center"
                        }, {
                            text: this.$t("right"),
                            value: "right"
                        }],
                        params: {
                            align: "center",
                            height: 100,
                            width: 100
                        }
                    }
                },
                methods: {}
            },
            xn = _n,
            yn = Object(I["a"])(xn, bn, wn, !1, null, null, null),
            Cn = yn.exports,
            kn = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-qualityService"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("choose_gradation_of_quality_assessment")
                    }
                }, [s("b-form-radio-group", {
                    staticClass: "mb-1",
                    attrs: {
                        buttons: "",
                        "button-variant": "outline-info",
                        size: "sm",
                        options: e.qtyList,
                        input: e.changeQty(e.params.qty)
                    },
                    model: {
                        value: e.params.qty,
                        callback: function(t) {
                            e.$set(e.params, "qty", t)
                        },
                        expression: "params.qty"
                    }
                })], 1)], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("message_after_the_vote")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.message.text,
                        expression: "params.message.text"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        type: "text"
                    },
                    domProps: {
                        value: e.params.message.text
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.message, "text", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-3"
                }, [s("label", [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.message.color
                                },
                                attrs: {
                                    "menu-position": "center",
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.message.color,
                                    callback: function(t) {
                                        e.$set(e.params.message, "color", t)
                                    },
                                    expression: "params.message.color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }])
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.message.color,
                        expression: "params.message.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        type: "text"
                    },
                    domProps: {
                        value: e.params.message.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.message, "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.message.size,
                        expression: "params.message.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.message.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.message, "size", t.target.value)
                        }
                    }
                })])])]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-8"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.font,
                        callback: function(t) {
                            e.$set(e.params, "font", t)
                        },
                        expression: "params.font"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.size,
                        expression: "params.size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params, "size", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 quality-list"
                }, e._l(e.params.elements, (function(t, r) {
                    return s("div", {
                        key: r,
                        staticClass: "row quality-item"
                    }, [s("div", {
                        staticClass: "col-3 quality-img"
                    }, [t.img ? e._e() : s("button", {
                        directives: [{
                            name: "b-modal",
                            rawName: "v-b-modal.media-window",
                            modifiers: {
                                "media-window": !0
                            }
                        }],
                        staticClass: "btn btn-outline-info mt-4",
                        attrs: {
                            type: "button"
                        },
                        on: {
                            click: function(t) {
                                e.activeEl = r
                            }
                        }
                    }, [s("span", {
                        staticClass: "mdi mdi-image-plus"
                    })]), s("b-img", {
                        directives: [{
                            name: "show",
                            rawName: "v-show",
                            value: t.img,
                            expression: "el.img"
                        }, {
                            name: "b-modal",
                            rawName: "v-b-modal.media-window",
                            modifiers: {
                                "media-window": !0
                            }
                        }],
                        attrs: {
                            src: "/media/" + e.uploadMediaFolder + "/" + t.img + "?t" + e.t,
                            alt: ""
                        },
                        on: {
                            click: function(t) {
                                e.activeEl = r
                            }
                        }
                    })], 1), s("div", {
                        staticClass: "col-9 quality-setting"
                    }, [s("div", {
                        staticClass: "row"
                    }, [s("div", {
                        staticClass: "col-12"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", [e._v(e._s(e.$t("text")))]), s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model",
                            value: t.text,
                            expression: "el.text"
                        }],
                        staticClass: "form-control form-control-sm",
                        attrs: {
                            type: "text"
                        },
                        domProps: {
                            value: t.text
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(t, "text", s.target.value)
                            }
                        }
                    })])]), s("div", {
                        staticClass: "col-6"
                    }, [s("label", [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                        staticClass: "color-picker",
                        scopedSlots: e._u([{
                            key: "append",
                            fn: function() {
                                return [s("b-input-group-text", [s("verte", {
                                    style: {
                                        background: t.color
                                    },
                                    attrs: {
                                        "menu-position": "center",
                                        model: "hex"
                                    },
                                    model: {
                                        value: t.color,
                                        callback: function(s) {
                                            e.$set(t, "color", s)
                                        },
                                        expression: "el.color"
                                    }
                                }, [s("span")])], 1)]
                            },
                            proxy: !0
                        }], null, !0)
                    }, [s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model",
                            value: t.color,
                            expression: "el.color"
                        }],
                        staticClass: "form-control form-control-sm",
                        attrs: {
                            type: "text"
                        },
                        domProps: {
                            value: t.color
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(t, "color", s.target.value)
                            }
                        }
                    })])], 1)])])])
                })), 0)])])
            },
            Sn = [],
            $n = {
                components: {
                    CustomMultiselect: er,
                    verte: Mr["a"]
                },
                data: function() {
                    return {
                        uploadMediaFolder: me,
                        qtyList: [{
                            text: this.$t("variants") + ": 2",
                            value: 2
                        }, {
                            text: this.$t("variants") + ": 3",
                            value: 3
                        }, {
                            text: this.$t("variants") + ": 5",
                            value: 5
                        }],
                        newEl: {
                            text: "",
                            img: "",
                            value: 1,
                            color: "#444"
                        },
                        params: {
                            qty: 2,
                            font: "Verdana.ttf",
                            size: 16,
                            elements: [{
                                text: "Плохо",
                                img: "",
                                value: 1,
                                color: "#444"
                            }, {
                                text: "Хорошо",
                                img: "",
                                value: 2,
                                color: "#444"
                            }],
                            message: {
                                text: "Спасибо!",
                                color: "#f00",
                                size: 36
                            }
                        },
                        activeEl: 0,
                        fontList: ["Verdana", "Roboto", "Arial"]
                    }
                },
                computed: {
                    t: function() {
                        return Date.now()
                    }
                },
                created: function() {
                    this.getFonts()
                },
                methods: {
                    getFonts: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.fontList();
                                    case 2:
                                        e.fontList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    onSelectImage: function(e) {
                        this.params.elements[this.activeEl].img = e
                    },
                    changeQty: function(e) {
                        var t = this.params.elements.length;
                        if (e < t && (this.params.elements.pop(), this.changeQty(e)), e > t) {
                            var s = JSON.parse(JSON.stringify(this.newEl));
                            s.value = t + 1, this.params.elements.push(s), this.changeQty(e)
                        }
                    }
                }
            },
            Rn = $n,
            jn = (s("e5fb"), Object(I["a"])(Rn, kn, Sn, !1, null, "1841416c", null)),
            Tn = jn.exports,
            On = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-image-text"
                }, [s("div", {
                    staticClass: "row mb-3 mt-3"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("b-button", {
                    directives: [{
                        name: "b-modal",
                        rawName: "v-b-modal.media-window",
                        modifiers: {
                            "media-window": !0
                        }
                    }],
                    attrs: {
                        size: "sm"
                    }
                }, [e._v(e._s(e.$t("select_image")))]), s("b-button", {
                    staticClass: "mr-2 text-light",
                    attrs: {
                        size: "sm",
                        variant: "warning"
                    },
                    on: {
                        click: e.clearImage
                    }
                }, [e._v(e._s(e.$t("reset")))]), s("b-button", {
                    staticClass: "ml-5 text-light",
                    attrs: {
                        size: "sm",
                        variant: "info"
                    },
                    on: {
                        click: e.onSettingImg
                    }
                }, [e._v(e._s(e.$t("image_text.set")))])], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("custom-multiselect", {
                    attrs: {
                        options: e.screenList,
                        "track-by": "guid",
                        label: "name",
                        "allow-empty": !1,
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    on: {
                        input: function(t) {
                            return e.getScreenSize()
                        }
                    },
                    model: {
                        value: e.selectedScreen,
                        callback: function(t) {
                            e.selectedScreen = t
                        },
                        expression: "selectedScreen"
                    }
                })], 1)]), s("div", {
                    staticClass: "scene-wrapp mb-3 shadow-sm"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-8"
                }, [e.selectedScreen ? s("div", {
                    staticClass: "img-text-block",
                    style: {
                        height: e.selectedScreen._height + "px",
                        "background-image": e.getImagePath(e.params.img.fileName),
                        "background-color": e.params.img.color,
                        "background-repeat": e.params.img.repeat.value,
                        "background-size": e.params.img.size.value,
                        "background-position": e.params.img.center ? "center" : "top left"
                    },
                    attrs: {
                        id: "img-text-block"
                    },
                    on: {
                        click: e.outTextBlock
                    }
                }, e._l(e.params.text, (function(t, r) {
                    return s("div", {
                        key: r,
                        staticClass: "text-item",
                        class: {
                            active: r === e.selectedText - 1
                        },
                        style: {
                            "font-size": t._size + "px",
                            color: t.color,
                            "font-family": t.font,
                            "text-align": t.align,
                            width: t._width + "px",
                            height: t._height + "px",
                            top: t._top + "px",
                            left: t._left + "px"
                        },
                        attrs: {
                            contenteditable: r === e.selectedText - 1
                        },
                        domProps: {
                            textContent: e._s(t.text)
                        },
                        on: {
                            blur: e.onBlurText,
                            click: function(t) {
                                return e.selectText(r)
                            }
                        }
                    })
                })), 0) : e._e()]), s("div", {
                    staticClass: "col-4 text-list"
                }, [s("b-button", {
                    staticClass: "mt-2 mb-2 btn-block",
                    attrs: {
                        variant: "info"
                    },
                    on: {
                        click: e.addText
                    }
                }, [e._v(e._s(e.$t("image_text.add_text")) + " ")]), s("ul", {
                    staticClass: "list-group "
                }, e._l(e.params.text, (function(t, r) {
                    return s("li", {
                        key: r,
                        staticClass: "list-group-item list-group-item-action",
                        class: {
                            active: r === e.selectedText - 1
                        }
                    }, [s("span", {
                        staticClass: "text-name",
                        on: {
                            click: function(t) {
                                return e.selectText(r)
                            }
                        }
                    }, [e._v(e._s(t.text))]), s("span", {
                        staticClass: "btn-delete",
                        on: {
                            click: function(t) {
                                return e.deleteText(r)
                            }
                        }
                    }, [s("i", {
                        staticClass: "mdi mdi-close-circle"
                    })])])
                })), 0)], 1)])]), e.settingImg ? s("div", {
                    staticClass: "text-setting shadow-sm"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-img-color"
                    }
                }, [e._v(e._s(e.$t("image_text.bg_color")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.img.color,
                        expression: "params.img.color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-img-color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.img.color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.img, "color", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("span", {
                    staticClass: "sample-color",
                    style: {
                        background: e.params.img.color
                    }
                })]), s("div", {
                    staticClass: "col-3"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("in_the_center")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "fullScreen",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.img.center,
                        callback: function(t) {
                            e.$set(e.params.img, "center", t)
                        },
                        expression: "params.img.center"
                    }
                })], 1)], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("image_text.repeat")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.bgOptions.repeat,
                        "track-by": "value",
                        label: "text",
                        "allow-empty": !1,
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    model: {
                        value: e.params.img.repeat,
                        callback: function(t) {
                            e.$set(e.params.img, "repeat", t)
                        },
                        expression: "params.img.repeat"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("image_text.position")))]), s("vue-multiselect", {
                    attrs: {
                        options: e.bgOptions.size,
                        "track-by": "value",
                        label: "text",
                        "allow-empty": !1,
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    model: {
                        value: e.params.img.size,
                        callback: function(t) {
                            e.$set(e.params.img, "size", t)
                        },
                        expression: "params.img.size"
                    }
                })], 1)])])]) : e._e(), e.selectedText ? s("div", {
                    staticClass: "text-setting shadow-sm"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-text"
                    }
                }, [e._v(e._s(e.$t("text")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text[e.selectedText - 1].text,
                        expression: "params.text[selectedText - 1].text"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-text",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.text[e.selectedText - 1].text
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.text[e.selectedText - 1], "text", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-size"
                    }
                }, [e._v(e._s(e.$t("width")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text[e.selectedText - 1].width,
                        expression: "params.text[selectedText - 1].width"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-width",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.text[e.selectedText - 1].width
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.text[e.selectedText - 1], "width", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-size"
                    }
                }, [e._v(e._s(e.$t("height")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text[e.selectedText - 1].height,
                        expression: "params.text[selectedText - 1].height"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-height",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.text[e.selectedText - 1].height
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.text[e.selectedText - 1], "height", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-left"
                    }
                }, [e._v(e._s(e.$t("image_text.position_x")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text[e.selectedText - 1].left,
                        expression: "params.text[selectedText - 1].left"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-left",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.text[e.selectedText - 1].left
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.text[e.selectedText - 1], "left", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-top"
                    }
                }, [e._v(e._s(e.$t("image_text.position_y")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text[e.selectedText - 1].top,
                        expression: "params.text[selectedText - 1].top"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-top",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.text[e.selectedText - 1].top
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.text[e.selectedText - 1], "top", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("font")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1,
                        placeholder: e.$t("select_font")
                    },
                    model: {
                        value: e.params.text[e.selectedText - 1].font,
                        callback: function(t) {
                            e.$set(e.params.text[e.selectedText - 1], "font", t)
                        },
                        expression: "params.text[selectedText - 1].font"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "scene-text-size"
                    }
                }, [e._v(e._s(e.$t("size")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text[e.selectedText - 1].size,
                        expression: "params.text[selectedText - 1].size"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "scene-text-size",
                        max: "500",
                        maxlength: "3",
                        type: "number"
                    },
                    domProps: {
                        value: e.params.text[e.selectedText - 1].size
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.text[e.selectedText - 1], "size", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("label", {
                    attrs: {
                        for: "color"
                    }
                }, [e._v(e._s(e.$t("color")))]), s("b-input-group", {
                    staticClass: "color-picker",
                    scopedSlots: e._u([{
                        key: "append",
                        fn: function() {
                            return [s("b-input-group-text", [s("verte", {
                                style: {
                                    background: e.params.text[e.selectedText - 1].color
                                },
                                attrs: {
                                    "menu-position": "center",
                                    "enable-alpha": !1,
                                    "rgb-sliders": !0,
                                    model: "hex"
                                },
                                model: {
                                    value: e.params.text[e.selectedText - 1].color,
                                    callback: function(t) {
                                        e.$set(e.params.text[e.selectedText - 1], "color", t)
                                    },
                                    expression: "params.text[selectedText - 1].color"
                                }
                            }, [s("span")])], 1)]
                        },
                        proxy: !0
                    }], null, !1, 1825830821)
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.params.text[e.selectedText - 1].color,
                        expression: "params.text[selectedText - 1].color"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "color",
                        type: "text"
                    },
                    domProps: {
                        value: e.params.text[e.selectedText - 1].color
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.params.text[e.selectedText - 1], "color", t.target.value)
                        }
                    }
                })])], 1), s("div", {
                    staticClass: "col-7"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("alignment")
                    }
                }, [s("b-form-radio-group", {
                    staticClass: "mb-1",
                    attrs: {
                        buttons: "",
                        "button-variant": "outline-info",
                        size: "sm",
                        options: e.align
                    },
                    model: {
                        value: e.params.text[e.selectedText - 1].align,
                        callback: function(t) {
                            e.$set(e.params.text[e.selectedText - 1], "align", t)
                        },
                        expression: "params.text[selectedText - 1].align"
                    }
                })], 1)], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("ul", {
                    staticClass: "shortcode-helper"
                }, [s("li"), s("li", [s("span", [e._v("{currencySymbol}")]), e._v(" - " + e._s(e.$t("currency_symbol")))]), s("li", [s("span", [e._v("{orderSum}")]), e._v(" - " + e._s(e.$t("order_price")))]), s("li", [s("span", [e._v("{unpaidSum}")]), e._v(" - " + e._s(e.$t("amount_to_be_paid")))]), s("li", [s("span", [e._v("{paid}")]), e._v(" - " + e._s(e.$t("paid")))]), s("li", [s("span", [e._v("{surrender}")]), e._v(" - " + e._s(e.$t("surrender")))]), s("li", [s("span", [e._v("{discountSum}")]), e._v(" - " + e._s(e.$t("discount_amount")))]), s("li", [s("span", [e._v("{totalPieces}")]), e._v(" - " + e._s(e.$t("number_of_items")))]), s("li", [s("span", [e._v("{role}")]), e._v(" - " + e._s(e.$t("authorized_post_office")))]), s("li", [s("span", [e._v("{name}")]), e._v(" - " + e._s(e.$t("authorized_name")))]), s("li", [s("span", [e._v("{dishPrice:1234}")]), e._v(" - " + e._s(e.$t("price_of_dish_dish_code")))]), s("li", [s("span", [e._v("{dishName:1234}")]), e._v(" - " + e._s(e.$t("name_of_dish_dish_code")))])])])])]) : e._e()])
            },
            Pn = [],
            Nn = {
                components: {
                    CustomMultiselect: er,
                    verte: Mr["a"]
                },
                data: function() {
                    return {
                        uploadMediaFolder: me,
                        radioBoolOptions: [{
                            text: this.$t("yes"),
                            value: !0
                        }, {
                            text: this.$t("no"),
                            value: !1
                        }],
                        align: [{
                            text: this.$t("left"),
                            value: "left"
                        }, {
                            text: this.$t("in_the_center"),
                            value: "center"
                        }, {
                            text: this.$t("right"),
                            value: "right"
                        }],
                        params: {
                            img: {
                                fileName: "",
                                center: !1,
                                color: "#fff",
                                repeat: {
                                    value: "no-repeat",
                                    text: this.$t("no")
                                },
                                size: {
                                    value: "cover",
                                    text: this.$t("image_text.option_cover")
                                }
                            },
                            text: []
                        },
                        selectedText: null,
                        fontList: ["Verdana", "Roboto", "Arial"],
                        bgOptions: {
                            repeat: [{
                                text: this.$t("no"),
                                value: "no-repeat"
                            }, {
                                text: this.$t("yes"),
                                value: "repeat"
                            }, {
                                text: this.$t("image_text.option_repeat_x"),
                                value: "repeat-x"
                            }, {
                                text: this.$t("image_text.option_repeat_y"),
                                value: "repeat-y"
                            }],
                            size: [{
                                text: this.$t("no"),
                                value: "auto"
                            }, {
                                text: this.$t("image_text.option_cover"),
                                value: "cover"
                            }, {
                                text: this.$t("image_text.option_contain"),
                                value: "contain"
                            }]
                        },
                        settingImg: !1,
                        screenList: [],
                        selectedScreen: null
                    }
                },
                computed: {
                    isHideSidebar: function() {
                        return this.$store.state.isHideSidebar
                    },
                    t: function() {
                        return Date.now()
                    }
                },
                watch: {
                    isHideSidebar: function() {
                        var e = this;
                        setTimeout((function() {
                            e.getScreenSize()
                        }), 1)
                    },
                    params: {
                        handler: "recountTextBlock",
                        deep: !0
                    }
                },
                created: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, e.getScreensList();
                                case 2:
                                    e.$nextTick((function() {
                                        window.addEventListener("resize", this.getScreenSize), this.getScreenSize(), this.get(), this.getFonts()
                                    }));
                                case 3:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    get: function() {
                        var e = this;
                        this.params.text.forEach((function(t, s) {
                            e.recountTextBlock(s)
                        }))
                    },
                    getImagePath: function(e) {
                        return ' url("/media/'.concat(me, "/").concat(e, "?t=").concat(this.t, '")')
                    },
                    onSelectImage: function(e) {
                        this.params.img.fileName = e
                    },
                    clearImage: function() {
                        this.params.img.fileName = ""
                    },
                    getFonts: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.fontList();
                                    case 2:
                                        e.fontList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    addText: function() {
                        this.params.text.push({
                            size: 60,
                            color: "#429aff",
                            text: "New text ...",
                            font: "Verdana",
                            align: "left",
                            width: 400,
                            height: 150,
                            top: 10,
                            left: 10
                        })
                    },
                    selectText: function(e) {
                        this.selectedText = e + 1, this.settingImg = !1
                    },
                    onBlurText: function(e) {
                        this.params.text[this.selectedText - 1].text = e.target.innerText, this.selectedText = null
                    },
                    deleteText: function(e) {
                        e === this.selectedText - 1 && (this.selectedText = null), this.params.text.splice(e, 1)
                    },
                    outTextBlock: function(e) {
                        e.target.classList.contains("text-item") ? this.settingImg = !1 : this.selectedText = null
                    },
                    onSettingImg: function() {
                        this.settingImg = !this.settingImg, this.selectedText = null
                    },
                    getScreensList: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, _.getScreensList();
                                    case 2:
                                        e.screenList = t.sent, e.selectedScreen = e.screenList[0];
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    getScreenSize: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        s = document.getElementById("img-text-block"), e.selectedScreen._width = s.offsetWidth, e.selectedScreen._height = e.selectedScreen.height * e.selectedScreen._width / e.selectedScreen.width, e.selectedScreen.scaleY = e.selectedScreen._height / e.selectedScreen.height, e.selectedScreen.scaleX = e.selectedScreen._width / e.selectedScreen.width, e.params.text.forEach((function(t, s) {
                                            e.recountTextBlock(s)
                                        })), e.$forceUpdate();
                                    case 7:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    recountTextBlock: function(e) {
                        var t = this;
                        this.selectedScreen && this.params.text.forEach((function(e) {
                            e && (e._width = e.width * t.selectedScreen.scaleX, e._height = e.height * t.selectedScreen.scaleY, e._top = e.top * t.selectedScreen.scaleY, e._left = e.left * t.selectedScreen.scaleX, e._size = e.size * t.selectedScreen.scaleX)
                        }))
                    }
                }
            },
            Ln = Nn,
            Dn = (s("b115"), Object(I["a"])(Ln, On, Pn, !1, null, null, null)),
            Fn = Dn.exports,
            zn = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "scene-template scene-dish-image"
                }, [s("br"), s("br"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("stretch")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "fullScreen",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.params.full,
                        callback: function(t) {
                            e.$set(e.params, "full", t)
                        },
                        expression: "params.full"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "offset-1 col-7"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("alignment")
                    }
                }, [s("b-form-radio-group", {
                    staticClass: "mb-1",
                    attrs: {
                        disabled: e.params.full,
                        buttons: "",
                        "button-variant": "outline-info",
                        size: "sm",
                        options: e.align
                    },
                    model: {
                        value: e.params.align,
                        callback: function(t) {
                            e.$set(e.params, "align", t)
                        },
                        expression: "params.align"
                    }
                })], 1)], 1)])])])
            },
            Mn = [],
            An = {
                data: function() {
                    return {
                        params: {
                            code: null,
                            align: "center",
                            full: !0,
                            last: !0
                        },
                        radioBoolOptions: [{
                            text: this.$t("yes"),
                            value: !0
                        }, {
                            text: this.$t("no"),
                            value: !1
                        }],
                        align: [{
                            text: this.$t("left"),
                            value: "left"
                        }, {
                            text: this.$t("in_the_center"),
                            value: "center"
                        }, {
                            text: this.$t("right"),
                            value: "right"
                        }]
                    }
                },
                methods: {}
            },
            In = An,
            En = Object(I["a"])(In, zn, Mn, !1, null, null, null),
            Bn = En.exports,
            Hn = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("b-modal", {
                    ref: "media-window",
                    attrs: {
                        id: "media-window",
                        title: "gallery" === e.sceneType.value ? e.$t("add_media") : "video" === e.sceneType.value ? e.$t("video") : e.$t("pictures"),
                        "hide-footer": ""
                    },
                    on: {
                        show: e.getMedia
                    }
                }, ["video" !== e.sceneType.value ? s("div", {
                    staticClass: "mt-2"
                }, [s("b-form-file", {
                    ref: "file-input",
                    staticClass: "mb-2",
                    attrs: {
                        id: "scene-image-file",
                        accept: "gallery" === e.sceneType.value ? "*" : "video" === e.sceneType.value ? "video/*" : "image/*",
                        "browse-text": e.$t("browse") + " ...",
                        placeholder: e.$t("choose")
                    },
                    on: {
                        change: function(t) {
                            return e.readFileUrl(t)
                        }
                    }
                }), s("hr")], 1) : e._e(), "image" === e.sceneType.value || "imageText" === e.sceneType.value || "gallery" === e.sceneType.value || "qualityService" === e.sceneType.value ? s("div", {
                    staticClass: "row"
                }, [e._l(e.images, (function(t) {
                    return s("div", {
                        key: t.name,
                        staticClass: "col-3 mt-2"
                    }, [s("img", {
                        staticClass: "img-fluid",
                        attrs: {
                            src: "/media/" + e.uploadMediaFolder + "/" + t.name,
                            property: t.name,
                            alt: ""
                        },
                        on: {
                            click: function(s) {
                                return e.selectImage(t.name)
                            }
                        }
                    })])
                })), "gallery" === e.sceneType.value ? s("div", {
                    staticClass: "col-12 mt-2"
                }, [s("b-list-group", e._l(e.videos, (function(t) {
                    return s("b-list-group-item", {
                        key: t.name,
                        attrs: {
                            button: ""
                        },
                        on: {
                            click: function(s) {
                                return e.selectVideo(t.name)
                            }
                        }
                    }, [e._v(" " + e._s(t.name) + " ")])
                })), 1)], 1) : e._e()], 2) : e._e(), "video" === e.sceneType.value ? s("div", [e.videos.length < 1 ? s("div", {
                    staticClass: "text-center py-3 text-muted"
                }, [e._v("Видео не найдено")]) : e._e(), s("b-list-group", e._l(e.videos, (function(t) {
                    return s("b-list-group-item", {
                        key: t.name,
                        attrs: {
                            button: ""
                        },
                        on: {
                            click: function(s) {
                                return e.selectVideo(t.name)
                            }
                        }
                    }, [e._v(" " + e._s(t.name) + " ")])
                })), 1)], 1) : e._e(), s("hr"), s("div", {
                    staticClass: "mt-3 text-right"
                }, [s("b-button", {
                    on: {
                        click: e.hideModal
                    }
                }, [e._v(e._s(e.$t("close")))])], 1), e.isLoading ? s("div", {
                    staticClass: "loader"
                }, [s("div", {
                    staticClass: "spinner-border",
                    attrs: {
                        role: "status"
                    }
                }, [s("span", {
                    staticClass: "sr-only"
                }, [e._v("Loading...")])])]) : e._e()])
            },
            Vn = [],
            Un = (s("a630"), s("466d"), {
                name: "MediaWindow",
                props: {
                    sceneType: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                data: function() {
                    return {
                        uploadMediaFolder: me,
                        videoFolder: pe,
                        images: [],
                        videos: [],
                        uploadImages: [],
                        uploadVideos: [],
                        isLoading: !1
                    }
                },
                watch: {
                    sceneType: {
                        handler: "newType",
                        deep: !0
                    }
                },
                methods: {
                    newType: function() {},
                    selectImage: function(e) {
                        this.$emit("select-image", e), this.hideModal()
                    },
                    selectVideo: function(e) {
                        this.$emit("select-video", e), this.hideModal()
                    },
                    hideModal: function() {
                        this.$refs["media-window"].hide()
                    },
                    getMedia: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        if ("video" !== e.sceneType.value) {
                                            t.next = 4;
                                            break
                                        }
                                        S.getMedia(e.videoFolder).then((function(t) {
                                            e.videos = t
                                        })), t.next = 12;
                                        break;
                                    case 4:
                                        if ("gallery" !== e.sceneType.value) {
                                            t.next = 11;
                                            break
                                        }
                                        return t.next = 7, S.getMedia(e.uploadMediaFolder).then((function(t) {
                                            e.images = t
                                        }));
                                    case 7:
                                        return t.next = 9, S.getMedia(e.videoFolder).then((function(t) {
                                            e.videos = t
                                        }));
                                    case 9:
                                        t.next = 12;
                                        break;
                                    case 11:
                                        S.getMedia(e.uploadMediaFolder).then((function(t) {
                                            e.images = t
                                        }));
                                    case 12:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    readFileUrl: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        if ("video" !== t.sceneType.value) {
                                            s.next = 5;
                                            break
                                        }
                                        return s.next = 3, t.uploadVideo(e);
                                    case 3:
                                        s.next = 14;
                                        break;
                                    case 5:
                                        if ("gallery" !== t.sceneType.value) {
                                            s.next = 12;
                                            break
                                        }
                                        return s.next = 8, t.uploadImage(e);
                                    case 8:
                                        return s.next = 10, t.uploadVideo(e);
                                    case 10:
                                        s.next = 14;
                                        break;
                                    case 12:
                                        return s.next = 14, t.uploadImage(e);
                                    case 14:
                                        t.$refs["file-input"].reset();
                                    case 15:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    uploadImage: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r, n, a;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        if (r = Array.from(e.target.files), n = r.length, t.uploadImages = [], n) {
                                            s.next = 5;
                                            break
                                        }
                                        return s.abrupt("return");
                                    case 5:
                                        a = 0, t.isLoading = !0, Array.from(r).forEach((function(e) {
                                            var s = new FileReader;
                                            s.readAsDataURL(e), s.onload = function(s) {
                                                t.uploadImages.push({
                                                    raw: s.currentTarget.result.split(",").pop(),
                                                    name: e.name
                                                }), a++, a === n && (t.$refs["file-input"].reset(), S.uploadMedia({
                                                    dir: t.uploadMediaFolder,
                                                    files: t.uploadImages
                                                }).then((function(e) {
                                                    t.isLoading = !1, t.getMedia()
                                                })).catch((function(e) {
                                                    t.isLoading = !1, t.getMedia()
                                                })))
                                            }
                                        }));
                                    case 8:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    uploadVideo: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r, n, a, o, i;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        if (r = K(), n = e.target.files[0], a = r.selfHostingPort, t.uploadVideos = [], !n || !n.type.match("video")) {
                                            s.next = 12;
                                            break
                                        }
                                        return o = new FormData, i = new File([n], "".concat(t.videoFolder, "/").concat(n.name), {
                                            type: n.type
                                        }), o.append("file", i), o.append("type", i.type), t.isLoading = !0, s.next = 12, fetch("http://localhost:".concat(a, "/api/media/uploadFormData"), {
                                            method: "POST",
                                            body: o,
                                            mode: "no-cors"
                                        }).finally((function() {
                                            t.isLoading = !1, t.getMedia()
                                        }));
                                    case 12:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    }
                }
            }),
            qn = Un,
            Wn = (s("2a1a"), Object(I["a"])(qn, Hn, Vn, !1, null, "cde48b54", null)),
            Yn = Wn.exports,
            Gn = {
                name: "SceneEdit",
                components: {
                    MediaWindow: Yn,
                    imageScene: Dr,
                    textScene: Br,
                    videoScene: Yr,
                    checkScene: Jr,
                    customScene: nn,
                    galleryScene: mn,
                    displayScene: hn,
                    qrCodeScene: Cn,
                    qualityServiceScene: Tn,
                    imageText: Fn,
                    dishImage: Bn,
                    CustomMultiselect: er,
                    VueMultiselect: Zs["a"]
                },
                data: function() {
                    return {
                        sceneTypes: ne().sceneTypes,
                        scene: {
                            type: void 0,
                            name: null,
                            guid: null
                        },
                        selectedSceneType: {
                            value: null,
                            text: null
                        }
                    }
                },
                created: function() {
                    this.$store.commit("setPageTitle", this.$t("scene_editor")), this.$route.params.guid && this.get(this.$route.params.guid)
                },
                methods: {
                    selectImage: function(e) {
                        this.$refs.sceneItem.onSelectImage(e)
                    },
                    selectVideo: function(e) {
                        this.$refs.sceneItem.onSelectVideo(e)
                    },
                    get: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        return s.next = 2, yr.get(e);
                                    case 2:
                                        r = s.sent, t.scene.type = r.type, t.scene.name = r.name, t.scene.guid = r.guid, t.selectedSceneType.value = r.type, t.$nextTick((function() {
                                            this.$refs.sceneItem.params = Object.assign(this.$refs.sceneItem.params, r.params)
                                        }));
                                    case 8:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    onSave: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return s = e.$refs.sceneItem.params, t.next = 3, yr.set(e.scene, s);
                                    case 3:
                                        r = t.sent, r.error ? e.$msg.error(r, e) : e.$router.push({
                                            name: "scenes"
                                        });
                                    case 5:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    sceneTypeSelected: function() {
                        this.scene.type = this.selectedSceneType.value
                    }
                }
            },
            Xn = Gn,
            Zn = Object(I["a"])(Xn, Rr, jr, !1, null, "46c67785", null),
            Kn = Zn.exports,
            Qn = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return e.loaded ? s("div", {
                    staticClass: "page-settings"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("form", [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, ["connect" === e.activeTab ? s("span", {
                    staticClass: "tab-ttl"
                }, [e._v(e._s(e.$t("connection_settings")))]) : e._e(), "screen" === e.activeTab ? s("span", {
                    staticClass: "tab-ttl"
                }, [e._v(e._s(e.$t("screen_settings")))]) : e._e(), "general" === e.activeTab ? s("span", {
                    staticClass: "tab-ttl"
                }, [e._v(e._s(e.$t("general_settings")))]) : e._e(), "servers" === e.activeTab ? s("span", {
                    staticClass: "tab-ttl"
                }, [e._v(e._s(e.$t("servers_settings")))]) : e._e(), "licence" === e.activeTab ? s("span", {
                    staticClass: "tab-ttl"
                }, [e._v(e._s(e.$t("license_settings")))]) : e._e()]), s("div", {
                    staticClass: "col-6"
                }, [s("b-button", {
                    staticClass: "float-right",
                    attrs: {
                        variant: "success",
                        type: "button"
                    },
                    on: {
                        click: function(t) {
                            return e.updateSettings()
                        }
                    }
                }, [e._v(e._s(e.$t("save")))])], 1)]), s("hr"), s("div", {
                    staticClass: "row mb-3"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("b-button", {
                    staticClass: "mr-2",
                    class: {
                        active: "general" === e.activeTab
                    },
                    attrs: {
                        variant: "outline-secondary",
                        size: "sm"
                    },
                    on: {
                        click: function(t) {
                            return e.tabChange("general")
                        }
                    }
                }, [e._v(" " + e._s(e.$t("general")) + " ")]), s("b-button", {
                    staticClass: "mr-2",
                    class: {
                        active: "screen" === e.activeTab
                    },
                    attrs: {
                        variant: "outline-secondary",
                        size: "sm"
                    },
                    on: {
                        click: function(t) {
                            return e.tabChange("screen")
                        }
                    }
                }, [e._v(" " + e._s(e.$t("screens")) + " ")]), s("b-button", {
                    staticClass: "mr-2",
                    class: {
                        active: "connect" === e.activeTab
                    },
                    attrs: {
                        variant: "outline-secondary",
                        size: "sm"
                    },
                    on: {
                        click: function(t) {
                            return e.tabChange("connect")
                        }
                    }
                }, [e._v(" " + e._s(e.$t("connection")) + " ")]), s("b-button", {
                    staticClass: "mr-2",
                    class: {
                        active: "servers" === e.activeTab
                    },
                    attrs: {
                        variant: "outline-secondary",
                        size: "sm"
                    },
                    on: {
                        click: function(t) {
                            return e.tabChange("servers")
                        }
                    }
                }, [e._v(" " + e._s(e.$t("servers")) + " ")]), s("b-button", {
                    staticClass: "mr-2",
                    class: {
                        active: "licence" === e.activeTab
                    },
                    attrs: {
                        variant: "outline-secondary",
                        size: "sm"
                    },
                    on: {
                        click: function(t) {
                            return e.tabChange("licence")
                        }
                    }
                }, [e._v(" " + e._s(e.$t("license")) + " ")])], 1)]), s("hr"), "connect" === e.activeTab ? s("setting-connection", {
                    attrs: {
                        settings: e.settings
                    }
                }) : e._e(), "screen" === e.activeTab ? s("setting-screens", {
                    attrs: {
                        screens: e.screens,
                        "radio-bool-options": e.radioBoolOptions
                    },
                    on: {
                        "change-screens": e.changeScreens
                    }
                }) : e._e(), "general" === e.activeTab ? s("setting-general", {
                    attrs: {
                        settings: e.settings,
                        "radio-bool-options": e.radioBoolOptions
                    }
                }) : e._e(), "servers" === e.activeTab ? s("setting-servers", {
                    attrs: {
                        settings: e.settings
                    }
                }) : e._e(), "licence" === e.activeTab ? s("div", {
                    staticClass: "tab license-tab"
                }, [e.lic.dealerTocken ? e._e() : s("div", {
                    staticClass: "dealer-auth"
                }, [s("form", [e.licKey ? s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-3"
                }, [s("h6", {
                    staticClass: "text-center text-info"
                }, [e._v(" " + e._s(e.$t("license_key")) + ": "), s("br"), s("span", {
                    staticClass: "font-weight-bold"
                }, [e._v(e._s(e.licKey))])])])]) : e._e(), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-3"
                }, [s("h6", {
                    staticClass: "title text-center text-danger"
                }, [e._v(e._s(e.$t("dealer_authorization")))]), s("p", {
                    staticClass: "text-center alert-warning p-1"
                }, [e._v(e._s(e.$t("license_page.login_warning")))])])]), s("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: e.lic.error.text,
                        expression: "lic.error.text"
                    }],
                    staticClass: "row mb-3 justify-content-center"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("div", {
                    staticClass: "alert-danger text-center p-1"
                }, [e._v(" " + e._s(e.lic.error.text)), s("br"), e._v(" " + e._s(e.lic.error.desc) + " ")])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "offset-3 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    staticStyle: {
                        display: "none"
                    },
                    attrs: {
                        for: "login"
                    }
                }), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.lic.user,
                        expression: "lic.user"
                    }],
                    staticClass: "form-control",
                    attrs: {
                        id: "login",
                        placeholder: e.$t("login")
                    },
                    domProps: {
                        value: e.lic.user
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.lic, "user", t.target.value)
                        }
                    }
                })]), s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    staticStyle: {
                        display: "none"
                    },
                    attrs: {
                        for: "password"
                    }
                }), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.lic.password,
                        expression: "lic.password"
                    }],
                    staticClass: "form-control",
                    attrs: {
                        id: "password",
                        type: "password",
                        placeholder: e.$t("password")
                    },
                    domProps: {
                        value: e.lic.password
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.lic, "password", t.target.value)
                        }
                    }
                })]), s("b-btn", {
                    staticClass: "btn btn-success btn-block mdi mdi-login-variant",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: e.dealerAuth
                    }
                }, [e._v(" " + e._s(e.$t("authorization")) + " ")])], 1)])])]), s("b-alert", {
                    staticClass: "col-12",
                    attrs: {
                        variant: "success",
                        fade: "",
                        show: e.lic.generated,
                        dismissible: ""
                    }
                }, [s("div", [s("span", {
                    staticClass: "mdi mdi-check mdi-24px mr-3"
                }), e._v(e._s(e.lic.generated)), s("br")])]), e.lic.dealerTocken ? s("b-card", {
                    staticClass: "bg-white border-0",
                    attrs: {
                        "no-body": ""
                    }
                }, [s("div", {
                    staticClass: "get-license-content mb-4"
                }, [s("div", {
                    staticClass: "ttl"
                }, [e._v(e._s(e.$t("license_page.select_obj")))]), s("div", {
                    staticClass: "get-license-form"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label"), s("br"), e.lic.dealerObj.id ? s("div", [s("span", {
                    staticClass: "text-info"
                }, [e._v(e._s(e.lic.dealerObj.name))]), s("br"), s("span", {
                    staticClass: "small font-weight-bold"
                }, [e._v(e._s(e.lic.dealerObj.id))]), s("br")]) : e._e(), e.lic.dealerObj.id ? e._e() : s("div", {
                    staticClass: "text-center small text-danger bg-light mt-2 py-1"
                }, [e._v(e._s(e.$t("license_page.obj_in_not_selected")))])])]), s("div", {
                    staticClass: "offset-1 col-5"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [s("br")]), s("br"), s("b-button", {
                    attrs: {
                        variant: "info",
                        type: "button"
                    },
                    on: {
                        click: e.openDealerSelector
                    }
                }, [e._v(" " + e._s(e.$t("choose")) + " ")])], 1)])])])]), s("b-tabs", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: e.lic.dealerObj.id,
                        expression: "lic.dealerObj.id"
                    }],
                    attrs: {
                        "content-class": "m-3",
                        justified: ""
                    },
                    model: {
                        value: e.lic.tabIndex,
                        callback: function(t) {
                            e.$set(e.lic, "tabIndex", t)
                        },
                        expression: "lic.tabIndex"
                    }
                }, [s("b-tab", {
                    attrs: {
                        "title-link-class": e.linkClass(0)
                    },
                    scopedSlots: e._u([{
                        key: "title",
                        fn: function() {
                            return [e._v(" " + e._s(e.$t("new")) + " ")]
                        },
                        proxy: !0
                    }], null, !1, 2206829181)
                }, [s("div", {
                    staticClass: "generate-license row"
                }, [e.lic.master ? s("div", {
                    staticClass: "col-12"
                }) : e._e(), s("div", {
                    staticClass: "col-md-12 col-lg-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("choose_a_master_license")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.lic.masterList,
                        label: "productName",
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    on: {
                        close: function(t) {
                            e.lic.generated = !1
                        }
                    },
                    scopedSlots: e._u([{
                        key: "option",
                        fn: function(t) {
                            return [s("div", [e._v(e._s(t.option["productName"])), s("br"), s("span", {
                                staticClass: "small font-weight-bold mt-1"
                            }, [e._v(" " + e._s(e.$t("time_left")) + ": " + e._s(t.option["qty"] - t.option["qtyUsed"]) + " из " + e._s(t.option["qty"]) + " ")]), s("br"), s("span", {
                                staticClass: "small font-weight-bold"
                            }, [e._v(" " + e._s(e.$t("valid_until")) + ": " + e._s(t.option["expirationDate"]) + " ")])])]
                        }
                    }], null, !1, 3467817096),
                    model: {
                        value: e.lic.master,
                        callback: function(t) {
                            e.$set(e.lic, "master", t)
                        },
                        expression: "lic.master"
                    }
                })], 1), s("button", {
                    staticClass: "btn btn-info mdi mdi-login-variant float-right",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: e.generateLicense
                    }
                }, [e._v(" " + e._s(e.$t("generate")) + " ")])])])]), s("b-tab", {
                    attrs: {
                        "title-link-class": e.linkClass(1)
                    },
                    scopedSlots: e._u([{
                        key: "title",
                        fn: function() {
                            return [e._v(" " + e._s(e.$t("binding")) + " ")]
                        },
                        proxy: !0
                    }], null, !1, 1764917568)
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 small mb-3 text-danger"
                }, [s("span", {
                    staticClass: "font-weight-bold"
                }, [e._v(e._s(e.$t("attention")) + "!")]), s("br"), e._v(" " + e._s(e.$t("restore_db")) + " ")])]), s("div", {
                    staticClass: "use-license row"
                }, [s("div", {
                    staticClass: "offset-3 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("list_of_licenses")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.lic.list,
                        label: "key",
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    model: {
                        value: e.lic.license,
                        callback: function(t) {
                            e.$set(e.lic, "license", t)
                        },
                        expression: "lic.license"
                    }
                })], 1), e.lic.license ? s("div", {
                    staticClass: "col-12 text-info small mb-3"
                }, [e._v(" " + e._s(e.$t("valid_until")) + ": "), s("span", {
                    staticClass: "font-weight-bold "
                }, [e._v(e._s(e.lic.license.expirationDate))])]) : e._e(), s("button", {
                    staticClass: "btn btn-info btn-block mdi mdi-login-variant",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: e.initGsLicense
                    }
                }, [e._v(" " + e._s(e.$t("use")) + " ")])])])])], 1)], 1) : e._e()], 1) : e._e()], 1)]), e.lic.objSelector ? s("div", {
                    staticClass: "obj-selector-overlay"
                }, [s("div", {
                    staticClass: "obj-selector"
                }, [s("div", {
                    staticClass: "ttl"
                }, [e._v(e._s(e.$t("object_selection")))]), s("div", {
                    staticClass: "object-list-search"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-sm-3"
                }), s("div", {
                    staticClass: "col-sm-6"
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.lic.objSearch,
                        expression: "lic.objSearch"
                    }],
                    staticClass: "form-control",
                    attrs: {
                        type: "text",
                        placeholder: e.$t("search") + "..."
                    },
                    domProps: {
                        value: e.lic.objSearch
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.lic, "objSearch", t.target.value)
                        }
                    }
                })])])]), e.lic.objLoaded ? s("div", {
                    staticClass: "object-list"
                }, e._l(e.filteredList, (function(t) {
                    return s("div", {
                        key: t.id,
                        staticClass: "item",
                        on: {
                            click: function(s) {
                                return e.selectDealerObj(t)
                            }
                        }
                    }, [s("div", {
                        staticClass: "name"
                    }, [e._v(e._s(t.name))]), s("div", {
                        staticClass: "id"
                    }, [e._v(e._s(t.id))])])
                })), 0) : e._e(), e.lic.objLoaded ? e._e() : s("div", {
                    staticClass: "loading"
                }, [s("div", {
                    staticClass: "loader mdi mdi-hexagon-multiple mdi-spin"
                })]), s("div", {
                    staticClass: "close-selector mdi mdi-close",
                    on: {
                        click: function(t) {
                            return e.closeDealerSelector()
                        }
                    }
                })])]) : e._e()]) : e._e()
            },
            Jn = [],
            ea = (s("caad"), s("2532"), function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "tab"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "centralizationServerAddress"
                    }
                }, [e._v(e._s(e.$t("centralizationServerAddress")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.centralizationServerAddress,
                        expression: "settings.centralizationServerAddress"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "centralizationServerAddress",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.centralizationServerAddress
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "centralizationServerAddress", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "licServerAddress"
                    }
                }, [e._v(e._s(e.$t("licServerAddress")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.licServerAddress,
                        expression: "settings.licServerAddress"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "licServerAddress",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.licServerAddress
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "licServerAddress", t.target.value)
                        }
                    }
                })])])]), s("br"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "licProtectServerAddress"
                    }
                }, [e._v(e._s(e.$t("licProtectServerAddress")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.licProtectServerAddress,
                        expression: "settings.licProtectServerAddress"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "licProtectServerAddress",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.licProtectServerAddress
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "licProtectServerAddress", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "weblateServerAddress"
                    }
                }, [e._v(e._s(e.$t("weblateServerAddress")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.weblateServerAddress,
                        expression: "settings.weblateServerAddress"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "weblateServerAddress",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.weblateServerAddress
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "weblateServerAddress", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "webDavServerAddress"
                    }
                }, [e._v(e._s(e.$t("webDavServerAddress")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.webDavServerAddress,
                        expression: "settings.webDavServerAddress"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "webDavServerAddress",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.webDavServerAddress
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "webDavServerAddress", t.target.value)
                        }
                    }
                })])])])])
            }),
            ta = [],
            sa = {
                name: "SettingServers",
                props: {
                    settings: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                methods: {}
            },
            ra = sa,
            na = Object(I["a"])(ra, ea, ta, !1, null, null, null),
            aa = na.exports,
            oa = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return e.screens ? s("div", {
                    staticClass: "tab"
                }, e._l(e.screensEdt, (function(t, r) {
                    return s("div", {
                        key: t.guid,
                        staticClass: "screens-item bg-light p-3 mb-4"
                    }, [s("div", {
                        staticClass: "row"
                    }, [s("div", {
                        staticClass: "col-6"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", {
                        attrs: {
                            for: "screen-name"
                        }
                    }, [e._v(e._s(e.$t("name")))]), s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model.number",
                            value: t.name,
                            expression: "screen.name",
                            modifiers: {
                                number: !0
                            }
                        }],
                        staticClass: "form-control form-control-sm",
                        attrs: {
                            id: "screen-name",
                            type: "text"
                        },
                        domProps: {
                            value: t.name
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(t, "name", e._n(s.target.value))
                            },
                            blur: function(t) {
                                return e.$forceUpdate()
                            }
                        }
                    })])]), s("div", {
                        staticClass: "col-4"
                    }, [s("b-form-group", {
                        attrs: {
                            label: e.$t("screen")
                        }
                    }, [s("b-form-radio-group", {
                        attrs: {
                            id: "stayOnTop",
                            size: "sm",
                            options: e.radioBoolOptions,
                            buttons: "",
                            "button-variant": "outline-info",
                            name: "radio-btn-outline"
                        },
                        model: {
                            value: t.enabled,
                            callback: function(s) {
                                e.$set(t, "enabled", s)
                            },
                            expression: "screen.enabled"
                        }
                    })], 1)], 1)]), s("div", {
                        staticClass: "row"
                    }, [s("div", {
                        staticClass: "col-6"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", [e._v(e._s(e.$t("choose_monitor")))]), s("custom-multiselect", {
                        attrs: {
                            placeholder: e.$t("choose_values"),
                            options: e.monitorList,
                            label: "cmpName",
                            "close-on-select": !0,
                            "show-labels": !1
                        },
                        on: {
                            input: function(s) {
                                return e.changeMonitor(t)
                            }
                        },
                        model: {
                            value: t.monitor,
                            callback: function(s) {
                                e.$set(t, "monitor", s)
                            },
                            expression: "screen.monitor"
                        }
                    })], 1)])]), s("div", {
                        staticClass: "row"
                    }, [s("div", {
                        staticClass: "col-6"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", {
                        attrs: {
                            for: "clientSettings-top"
                        }
                    }, [e._v(e._s(e.$t("top_position")) + " (top)")]), s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model.number",
                            value: t.top,
                            expression: "screen.top",
                            modifiers: {
                                number: !0
                            }
                        }],
                        staticClass: "form-control form-control-sm",
                        attrs: {
                            id: "clientSettings-top",
                            type: "number"
                        },
                        domProps: {
                            value: t.top
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(t, "top", e._n(s.target.value))
                            },
                            blur: function(t) {
                                return e.$forceUpdate()
                            }
                        }
                    })])]), s("div", {
                        staticClass: "col-6"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", {
                        attrs: {
                            for: "clientSettings-left"
                        }
                    }, [e._v(e._s(e.$t("left_position")) + " (left)")]), s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model.number",
                            value: t.left,
                            expression: "screen.left",
                            modifiers: {
                                number: !0
                            }
                        }],
                        staticClass: "form-control form-control-sm",
                        attrs: {
                            id: "clientSettings-left",
                            type: "number"
                        },
                        domProps: {
                            value: t.left
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(t, "left", e._n(s.target.value))
                            },
                            blur: function(t) {
                                return e.$forceUpdate()
                            }
                        }
                    })])])]), s("div", {
                        staticClass: "row"
                    }, [s("div", {
                        staticClass: "col-6"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", {
                        attrs: {
                            for: "clientSettings-width"
                        }
                    }, [e._v(e._s(e.$t("screen_width")))]), s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model.number",
                            value: t.width,
                            expression: "screen.width",
                            modifiers: {
                                number: !0
                            }
                        }],
                        staticClass: "form-control form-control-sm",
                        attrs: {
                            id: "clientSettings-width",
                            type: "number"
                        },
                        domProps: {
                            value: t.width
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(t, "width", e._n(s.target.value))
                            },
                            blur: function(t) {
                                return e.$forceUpdate()
                            }
                        }
                    })])]), s("div", {
                        staticClass: "col-6"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", {
                        attrs: {
                            for: "clientSettings-height"
                        }
                    }, [e._v(e._s(e.$t("screen_height")))]), s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model.number",
                            value: t.height,
                            expression: "screen.height",
                            modifiers: {
                                number: !0
                            }
                        }],
                        staticClass: "form-control form-control-sm",
                        attrs: {
                            id: "clientSettings-height",
                            type: "number"
                        },
                        domProps: {
                            value: t.height
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(t, "height", e._n(s.target.value))
                            },
                            blur: function(t) {
                                return e.$forceUpdate()
                            }
                        }
                    })])])]), s("div", {
                        staticClass: "row"
                    }, [s("div", {
                        staticClass: "col-4"
                    }, [s("b-form-group", {
                        attrs: {
                            label: e.$t("full_screen")
                        }
                    }, [s("b-form-radio-group", {
                        attrs: {
                            id: "fullScreen",
                            size: "sm",
                            options: e.radioBoolOptions,
                            buttons: "",
                            "button-variant": "outline-info",
                            name: "radio-btn-outline"
                        },
                        model: {
                            value: t.fullScreen,
                            callback: function(s) {
                                e.$set(t, "fullScreen", s)
                            },
                            expression: "screen.fullScreen"
                        }
                    })], 1)], 1), s("div", {
                        staticClass: "col-4 text-right"
                    }, [s("b-form-group", {
                        attrs: {
                            label: e.$t("over_all_windows")
                        }
                    }, [s("b-form-radio-group", {
                        attrs: {
                            id: "stayOnTop",
                            size: "sm",
                            options: e.radioBoolOptions,
                            buttons: "",
                            "button-variant": "outline-info",
                            name: "radio-btn-outline"
                        },
                        model: {
                            value: t.stayOnTop,
                            callback: function(s) {
                                e.$set(t, "stayOnTop", s)
                            },
                            expression: "screen.stayOnTop"
                        }
                    })], 1)], 1)]), e.screens.length > 1 ? s("b-button", {
                        staticClass: "delete-screen",
                        attrs: {
                            variant: "danger",
                            type: "button",
                            size: "sm"
                        },
                        on: {
                            click: function(t) {
                                return e.delScreen(r)
                            }
                        }
                    }, [e._v("Удалить ")]) : e._e()], 1)
                })), 0) : e._e()
            },
            ia = [],
            ca = {
                name: "SettingScreens",
                components: {
                    CustomMultiselect: er
                },
                props: {
                    radioBoolOptions: {
                        type: Array,
                        default: function() {
                            return {}
                        }
                    },
                    screens: {
                        type: Array,
                        default: function() {
                            return {}
                        }
                    }
                },
                computed: {
                    monitorList: function() {
                        return this.monitors.map((function(e) {
                            return Object(ue["a"])(Object(ue["a"])({}, e), {}, {
                                cmpName: "".concat(e.name, " (").concat(e.deviceName, ")")
                            })
                        }))
                    }
                },
                data: function() {
                    return {
                        monitors: [],
                        screensEdt: JSON.parse(JSON.stringify(this.screens))
                    }
                },
                watch: {
                    screensEdt: {
                        deep: !0,
                        handler: function() {
                            this.$emit("change-screens", this.screensEdt)
                        }
                    }
                },
                created: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, e.getMonitors();
                                case 2:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    addNewScreen: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        e.screensEdt.push(G.addNewScreen());
                                    case 1:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    delScreen: function(e) {
                        this.screensEdt.splice(e, 1)
                    },
                    changeMonitor: function(e) {
                        e.monitor && (e.height = e.monitor.height, e.width = e.monitor.width, e.left = e.monitor.x, e.top = e.monitor.y)
                    },
                    getMonitors: function() {
                        var e = this;
                        G.monitors().then((function(t) {
                            e.monitors = t.map((function(e) {
                                return Object(ue["a"])(Object(ue["a"])({}, e), {}, {
                                    cmpName: "".concat(e.name, " (").concat(e.deviceName, ")")
                                })
                            }));
                            var s, r = Object(a["a"])(e.screensEdt);
                            try {
                                var n = function() {
                                    var t = s.value,
                                        r = e.monitors.findIndex((function(e) {
                                            return e["deviceName"] === t.monitor
                                        })); - 1 !== r && (t.monitor = e.monitors[r])
                                };
                                for (r.s(); !(s = r.n()).done;) n()
                            } catch (o) {
                                r.e(o)
                            } finally {
                                r.f()
                            }
                        }))
                    }
                }
            },
            la = ca,
            ua = Object(I["a"])(la, oa, ia, !1, null, null, null),
            ma = ua.exports,
            da = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "tab"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "Rk7XmlInterfaceAddress"
                    }
                }, [e._v(e._s(e.$t("HTTP_address")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.rk7XmlInterfaceAddress,
                        expression: "settings.rk7XmlInterfaceAddress"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "Rk7XmlInterfaceAddress",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.rk7XmlInterfaceAddress
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "rk7XmlInterfaceAddress", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "Rk7XmlInterfacePort"
                    }
                }, [e._v(e._s(e.$t("HTTP_port")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.rk7XmlInterfacePort,
                        expression: "settings.rk7XmlInterfacePort",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "Rk7XmlInterfacePort",
                        max: "65000",
                        maxlength: "5",
                        min: "0",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.rk7XmlInterfacePort
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "rk7XmlInterfacePort", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-3 text-right"
                }, [s("b-button", {
                    staticClass: "btn-block",
                    staticStyle: {
                        "margin-top": "24px"
                    },
                    attrs: {
                        variant: "info",
                        size: "sm"
                    },
                    on: {
                        click: e.check
                    }
                }, [e._v(e._s(e.$t("verify")) + " ")])], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "Rk7UserName"
                    }
                }, [e._v("RK7: " + e._s(e.$t("login")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.rk7UserName,
                        expression: "settings.rk7UserName"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "Rk7UserName",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.rk7UserName
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "rk7UserName", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "Rk7UserPassword"
                    }
                }, [e._v("RK7: " + e._s(e.$t("password")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.rk7UserPassword,
                        expression: "settings.rk7UserPassword"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "Rk7UserPassword",
                        type: "password"
                    },
                    domProps: {
                        value: e.settings.rk7UserPassword
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "rk7UserPassword", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "selfHostingPort"
                    }
                }, [e._v(e._s(e.$t("GS_port_(restart required)")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.selfHostingPort,
                        expression: "settings.selfHostingPort",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "selfHostingPort",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.selfHostingPort
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "selfHostingPort", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "rk7CashServerCode"
                    }
                }, [e._v(e._s(e.$t("cash_server_code")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.rk7CashServerCode,
                        expression: "settings.rk7CashServerCode",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "rk7CashServerCode",
                        readonly: "",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.rk7CashServerCode
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "rk7CashServerCode", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "rk7RestaurantCode"
                    }
                }, [e._v(e._s(e.$t("restaurant_code")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.rk7RestaurantCode,
                        expression: "settings.rk7RestaurantCode",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "rk7RestaurantCode",
                        readonly: "",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.rk7RestaurantCode
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "rk7RestaurantCode", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-9"
                }, [s("label", [e._v(e._s(e.$t("cash_desk_code")))]), s("custom-multiselect", e._b({
                    attrs: {
                        options: e.cashStationList
                    },
                    model: {
                        value: e.settings.rk7CashStationCodes,
                        callback: function(t) {
                            e.$set(e.settings, "rk7CashStationCodes", t)
                        },
                        expression: "settings.rk7CashStationCodes"
                    }
                }, "custom-multiselect", e.multiSelectConfig, !1))], 1), s("div", {
                    staticClass: "col-3 text-right"
                }, [s("b-button", {
                    staticClass: "btn-block",
                    staticStyle: {
                        "margin-top": "24px"
                    },
                    attrs: {
                        variant: "info",
                        size: "sm"
                    },
                    on: {
                        click: e.getCashStationsList
                    }
                }, [e._v(" " + e._s(e.$t("refresh")) + " ")])], 1)]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "Rk7RefSyncTimeout"
                    }
                }, [e._v(e._s(e.$t("clock_frequency_with_RK7")) + " (с)")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.rk7RefSyncTimeout,
                        expression: "settings.rk7RefSyncTimeout",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "Rk7RefSyncTimeout",
                        min: "60",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.rk7RefSyncTimeout
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "rk7RefSyncTimeout", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "XmlIgnoreDelayTimeout"
                    }
                }, [e._v(e._s(e.$t("xml_ignore_delay_timeout")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.xmlIgnoreDelayTimeout,
                        expression: "settings.xmlIgnoreDelayTimeout",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "XmlIgnoreDelayTimeout",
                        min: "0",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.xmlIgnoreDelayTimeout
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "xmlIgnoreDelayTimeout", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])])])
            },
            pa = [],
            fa = {
                name: "SettingConnectoin",
                components: {
                    CustomMultiselect: er
                },
                props: {
                    settings: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                data: function() {
                    return {
                        cashStationList: [],
                        multiSelectConfig: {
                            placeholder: this.$t("choose_values"),
                            selectedLabel: "Выбрано",
                            selectLabel: this.$t("add"),
                            deselectLabel: "Удалить",
                            multiple: !0,
                            closeOnSelect: !1,
                            clearOnSelect: !1,
                            searchable: !0,
                            optionsLimit: 50,
                            label: "name",
                            trackBy: "code"
                        }
                    }
                },
                created: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, e.getCashStationsList();
                                case 2:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    getCashStationsList: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.getCashStationsList().then((function(t) {
                                            e.cashStationList = t
                                        }));
                                    case 2:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    check: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.check(e.settings);
                                    case 2:
                                        if (s = t.sent, s.error) {
                                            t.next = 11;
                                            break
                                        }
                                        return e.settings.rk7CashServerCode = s.rk7CashServerCode, e.settings.rk7RestaurantCode = s.rk7RestaurantCode, t.next = 8, e.getCashStationsList();
                                    case 8:
                                        e.$msg.success(e.$t("connection_established") + "!", e), t.next = 14;
                                        break;
                                    case 11:
                                        e.settings.rk7CashServerCode = null, e.settings.rk7RestaurantCode = null, e.$msg.error(s, e);
                                    case 14:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    }
                }
            },
            va = fa,
            ga = Object(I["a"])(va, da, pa, !1, null, null, null),
            ha = ga.exports,
            ba = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return e.loaded ? s("div", {
                    staticClass: "tab"
                }, [s("setting-template", {
                    ref: "settings-template"
                }), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: e.logLevels
                    }
                }, [e._v(e._s(e.$t("logging_level")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.logLevels,
                        label: "text",
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    on: {
                        close: function(t) {
                            e.settings.logLevel = e.selectedLog.value
                        }
                    },
                    model: {
                        value: e.selectedLog,
                        callback: function(t) {
                            e.selectedLog = t
                        },
                        expression: "selectedLog"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "LogPeriodDays"
                    }
                }, [e._v(e._s(e.$t("log-period-days")) + " (" + e._s(e.$t("days")) + ")")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.logPeriodDays,
                        expression: "settings.logPeriodDays",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "LogPeriodDays",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.logPeriodDays
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "logPeriodDays", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("date_format")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.dateFormatList,
                        label: "text",
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    on: {
                        close: function(t) {
                            e.settings.dateFormat = e.dateFormat.text
                        }
                    },
                    model: {
                        value: e.dateFormat,
                        callback: function(t) {
                            e.dateFormat = t
                        },
                        expression: "dateFormat"
                    }
                })], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("language")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.languageList,
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    model: {
                        value: e.settings.language,
                        callback: function(t) {
                            e.$set(e.settings, "language", t)
                        },
                        expression: "settings.language"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "DemoTimeout"
                    }
                }, [e._v(e._s(e.$t("demo_timeout")) + " (с)")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.demoTimeout,
                        expression: "settings.demoTimeout",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "DemoTimeout",
                        type: "number"
                    },
                    domProps: {
                        value: e.settings.demoTimeout
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "demoTimeout", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-4 text-center"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("autostart")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "autoRun",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.settings.autoRun,
                        callback: function(t) {
                            e.$set(e.settings, "autoRun", t)
                        },
                        expression: "settings.autoRun"
                    }
                })], 1)], 1)]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: e.fontDefault
                    }
                }, [e._v(e._s(e.$t("upload_font")))]), s("b-form-file", {
                    ref: "font-input",
                    attrs: {
                        id: "font-upload",
                        "browse-text": e.$t("browse"),
                        placeholder: "..."
                    },
                    on: {
                        change: function(t) {
                            return e.readFileUrl(t)
                        }
                    }
                })], 1)]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: e.fontDefault
                    }
                }, [e._v(e._s(e.$t("default_font")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.fontList,
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    model: {
                        value: e.settings.fontDefault,
                        callback: function(t) {
                            e.$set(e.settings, "fontDefault", t)
                        },
                        expression: "settings.fontDefault"
                    }
                })], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "paySymbol"
                    }
                }, [e._v(e._s(e.$t("currency_symbol")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.paySymbol,
                        expression: "settings.paySymbol",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "paySymbol",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.paySymbol
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "paySymbol", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-4 text-center"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("currency_symbol_left")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "paySymbolLeft",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.settings.paySymbolLeft,
                        callback: function(t) {
                            e.$set(e.settings, "paySymbolLeft", t)
                        },
                        expression: "settings.paySymbolLeft"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "defaultPortionName"
                    }
                }, [e._v(e._s(e.$t("unit_of_measurement")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.defaultPortionName,
                        expression: "settings.defaultPortionName",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "defaultPortionName",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.defaultPortionName
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "defaultPortionName", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "triadSeparator"
                    }
                }, [e._v(e._s(e.$t("triad_separator")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.triadSeparator,
                        expression: "settings.triadSeparator",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "triadSeparator",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.triadSeparator
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "triadSeparator", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-4 text-center"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("show_pennies")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "showPennies",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.settings.showPennies,
                        callback: function(t) {
                            e.$set(e.settings, "showPennies", t)
                        },
                        expression: "settings.showPennies"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "penniesSeparator"
                    }
                }, [e._v(e._s(e.$t("penny_separator")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.settings.penniesSeparator,
                        expression: "settings.penniesSeparator",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "penniesSeparator",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.penniesSeparator
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.settings, "penniesSeparator", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 text-center font-weight-bold bg-light text-info py-2"
                }, [e.settings.paySymbolLeft ? s("span", [e._v(e._s(e.settings.paySymbol))]) : e._e(), e._v(e._s("10" + e.settings.triadSeparator + "000" + e.settings.triadSeparator + "000")), e.settings.showPennies ? s("span", [e._v(e._s(e.settings.penniesSeparator + "99"))]) : e._e(), e.settings.paySymbolLeft ? e._e() : s("span", [e._v(e._s(e.settings.paySymbol))])])]), s("div", {
                    staticClass: "row mt-2"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "rkExtPropNames"
                    }
                }, [e._v(e._s(e.$t("prop_names")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.settings.rkExtPropNames,
                        expression: "settings.rkExtPropNames"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "rkExtPropNames",
                        type: "text"
                    },
                    domProps: {
                        value: e.settings.rkExtPropNames
                    },
                    on: {
                        input: [function(t) {
                            t.target.composing || e.$set(e.settings, "rkExtPropNames", t.target.value)
                        }, function(t) {
                            return e.rkExtPropNamesValidation(e.settings.rkExtPropNames)
                        }]
                    }
                })])]), s("div", {
                    staticClass: "col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("show_amount_discount")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "showSummary",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.settings.showSummary,
                        callback: function(t) {
                            e.$set(e.settings, "showSummary", t)
                        },
                        expression: "settings.showSummary"
                    }
                })], 1)], 1)]), s("hr"), s("name-types-section", {
                    attrs: {
                        settings: e.settings
                    }
                }), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("media_source")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.mediaSource,
                        label: "text",
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    on: {
                        close: function(t) {
                            e.settings.mediaSourceType = e.selectedMediaSource.value
                        }
                    },
                    model: {
                        value: e.selectedMediaSource,
                        callback: function(t) {
                            e.selectedMediaSource = t
                        },
                        expression: "selectedMediaSource"
                    }
                })], 1)])]), s("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: "FromRk7Parameter" === e.selectedMediaSource.value,
                        expression: "selectedMediaSource.value === 'FromRk7Parameter'"
                    }],
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 text-center text-muted"
                }, [e._v(e._s(e.$t("the_parameters_of_connection_to_R_keeper_are_used_for_downloading")))])]), s("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: "FromLocalDir" === e.selectedMediaSource.value,
                        expression: "selectedMediaSource.value === 'FromLocalDir'"
                    }],
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "LocalDir"
                    }
                }, [e._v(e._s(e.$t("local_folder_path")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromLocalDir"].path,
                        expression: "mediaSourceRaws['FromLocalDir'].path"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "LocalDir",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromLocalDir"].path
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromLocalDir"], "path", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: "FromFtp" === e.selectedMediaSource.value,
                        expression: "selectedMediaSource.value === 'FromFtp'"
                    }],
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FTPhost"
                    }
                }, [e._v(e._s(e.$t("FTP_address")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromFtp"].host,
                        expression: "mediaSourceRaws['FromFtp'].host"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FTPhost",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromFtp"].host
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromFtp"], "host", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FTPport"
                    }
                }, [e._v(e._s(e.$t("FTP_port")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.mediaSourceRaws["FromFtp"].port,
                        expression: "mediaSourceRaws['FromFtp'].port",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FTPport",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromFtp"].port
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromFtp"], "port", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FTPUserName"
                    }
                }, [e._v(e._s(e.$t("login")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromFtp"].userName,
                        expression: "mediaSourceRaws['FromFtp'].userName"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FTPUserName",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromFtp"].userName
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromFtp"], "userName", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FTPUserPassword"
                    }
                }, [e._v(e._s(e.$t("password")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromFtp"].password,
                        expression: "mediaSourceRaws['FromFtp'].password"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FTPUserPassword",
                        type: "password"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromFtp"].password
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromFtp"], "password", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FTPPath"
                    }
                }, [e._v(e._s(e.$t("FTP_path")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromFtp"].path,
                        expression: "mediaSourceRaws['FromFtp'].path"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FTPPath",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromFtp"].path
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromFtp"], "path", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("FTP_passiveMode")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "enablePassiveMode",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.mediaSourceRaws["FromFtp"].enablePassiveMode,
                        callback: function(t) {
                            e.$set(e.mediaSourceRaws["FromFtp"], "enablePassiveMode", t)
                        },
                        expression: "mediaSourceRaws['FromFtp'].enablePassiveMode"
                    }
                })], 1)], 1)])])]), s("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: "FromHttp" === e.selectedMediaSource.value,
                        expression: "selectedMediaSource.value === 'FromHttp'"
                    }],
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FromHttpHost"
                    }
                }, [e._v(e._s(e.$t("Http_address")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromHttp"].host,
                        expression: "mediaSourceRaws['FromHttp'].host"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FromHttpHost",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromHttp"].host
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromHttp"], "host", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FromHttpPort"
                    }
                }, [e._v(e._s(e.$t("Http_port")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model.number",
                        value: e.mediaSourceRaws["FromHttp"].port,
                        expression: "mediaSourceRaws['FromHttp'].port",
                        modifiers: {
                            number: !0
                        }
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FromHttpPort",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromHttp"].port
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromHttp"], "port", e._n(t.target.value))
                        },
                        blur: function(t) {
                            return e.$forceUpdate()
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FromHttpUserName"
                    }
                }, [e._v(e._s(e.$t("login")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromHttp"].userName,
                        expression: "mediaSourceRaws['FromHttp'].userName"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FromHttpUserName",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromHttp"].userName
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromHttp"], "userName", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FromHttpPassword"
                    }
                }, [e._v(e._s(e.$t("password")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromHttp"].password,
                        expression: "mediaSourceRaws['FromHttp'].password"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FromHttpPassword",
                        type: "password"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromHttp"].password
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromHttp"], "password", t.target.value)
                        }
                    }
                })])])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "FromHttpPath"
                    }
                }, [e._v(e._s(e.$t("Http_path")) + " ")]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.mediaSourceRaws["FromHttp"].path,
                        expression: "mediaSourceRaws['FromHttp'].path"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "FromHttpPath",
                        type: "text"
                    },
                    domProps: {
                        value: e.mediaSourceRaws["FromHttp"].path
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.mediaSourceRaws["FromHttp"], "path", t.target.value)
                        }
                    }
                })])]), s("div", {
                    staticClass: "col-md-4 col-6"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("Http_use_https")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "useHttps",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.mediaSourceRaws["FromHttp"].useHttps,
                        callback: function(t) {
                            e.$set(e.mediaSourceRaws["FromHttp"], "useHttps", t)
                        },
                        expression: "mediaSourceRaws['FromHttp'].useHttps"
                    }
                })], 1)], 1)])])]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-3 fz-14 text-muted"
                }, [e._v(" " + e._s(e.$t("setting_general.bottom_text")) + " ")])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4 text-center"
                }, [s("b-form-group", {
                    attrs: {
                        label: e.$t("setting_general.start_on_start")
                    }
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "runWatcherOnStartup",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.settings.runWatcherOnStartup,
                        callback: function(t) {
                            e.$set(e.settings, "runWatcherOnStartup", t)
                        },
                        expression: "settings.runWatcherOnStartup"
                    }
                })], 1)], 1), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group text-right"
                }, [s("b-button", {
                    staticClass: "w-100",
                    staticStyle: {
                        "margin-top": "24px"
                    },
                    attrs: {
                        variant: "success",
                        disabled: !e.settings.runWatcherOnStartup,
                        size: "sm"
                    },
                    on: {
                        click: e.startWatcher
                    }
                }, [e._v(" Start ")])], 1)]), s("div", {
                    staticClass: "col-3"
                }, [s("fieldset", {
                    staticClass: "form-group text-right"
                }, [s("b-button", {
                    staticClass: "w-100",
                    staticStyle: {
                        "margin-top": "24px"
                    },
                    attrs: {
                        variant: "danger",
                        disabled: !e.settings.runWatcherOnStartup,
                        size: "sm"
                    },
                    on: {
                        click: e.stopWatcher
                    }
                }, [e._v(" Stop ")])], 1)]), e.settings.runWatcherOnStartup ? s("div", {
                    staticClass: "col-2 text-center"
                }, [e.stateWatcher ? s("p", {
                    staticClass: "text-success"
                }, [s("span", {
                    staticClass: "fz-14 small"
                }, [e._v(e._s(e.$t("setting_general.text_status")))]), s("br"), s("i", {
                    staticClass: "mdi mdi-lightbulb",
                    staticStyle: {
                        "font-size": "40px",
                        "line-height": "30px"
                    }
                })]) : s("p", {
                    staticClass: "text-danger"
                }, [s("span", {
                    staticClass: "fz-14 small"
                }, [e._v(e._s(e.$t("setting_general.text_status")))]), s("br"), s("i", {
                    staticClass: "mdi mdi-plus mdi-rotate-45",
                    staticStyle: {
                        "font-size": "40px",
                        "line-height": "30px"
                    }
                })])]) : e._e()]), s("b-modal", {
                    attrs: {
                        centered: "",
                        "hide-footer": "",
                        title: e.$t("setting_general.modal_title")
                    },
                    on: {
                        hidden: e.cancelImportTemplate
                    },
                    model: {
                        value: e.importedTemplate.selector,
                        callback: function(t) {
                            e.$set(e.importedTemplate, "selector", t)
                        },
                        expression: "importedTemplate.selector"
                    }
                }, [s("div", {
                    staticClass: "d-block text-left"
                }, [s("div", {
                    staticClass: "row my-3"
                }, [s("div", {
                    staticClass: "offset-1 col-5"
                }, [e.importedTemplate.importParams.includes("db") ? s("b-form-checkbox", {
                    attrs: {
                        size: "lg"
                    },
                    model: {
                        value: e.importedTemplate.db,
                        callback: function(t) {
                            e.$set(e.importedTemplate, "db", t)
                        },
                        expression: "importedTemplate.db"
                    }
                }, [e._v(" " + e._s(e.$t("data")) + " ")]) : e._e()], 1), s("div", {
                    staticClass: "col-5"
                }, [e.importedTemplate.importParams.includes("front") ? s("b-form-checkbox", {
                    attrs: {
                        size: "lg"
                    },
                    model: {
                        value: e.importedTemplate.front,
                        callback: function(t) {
                            e.$set(e.importedTemplate, "front", t)
                        },
                        expression: "importedTemplate.front"
                    }
                }, [e._v(" " + e._s(e.$t("design_template")) + " ")]) : e._e()], 1)]), s("div", {
                    staticClass: "row my-3"
                }, [s("div", {
                    staticClass: "offset-1 col-5"
                }, [e.importedTemplate.importParams.includes("video") ? s("b-form-checkbox", {
                    attrs: {
                        size: "lg"
                    },
                    model: {
                        value: e.importedTemplate.video,
                        callback: function(t) {
                            e.$set(e.importedTemplate, "video", t)
                        },
                        expression: "importedTemplate.video"
                    }
                }, [e._v(" " + e._s(e.$t("video")) + " ")]) : e._e()], 1), s("div", {
                    staticClass: "col-5"
                }, [e.importedTemplate.importParams.includes("images") ? s("b-form-checkbox", {
                    attrs: {
                        size: "lg"
                    },
                    model: {
                        value: e.importedTemplate.images,
                        callback: function(t) {
                            e.$set(e.importedTemplate, "images", t)
                        },
                        expression: "importedTemplate.images"
                    }
                }, [e._v(" " + e._s(e.$t("pictures")) + " ")]) : e._e()], 1)])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("b-button", {
                    staticClass: "mt-3",
                    attrs: {
                        variant: "outline-secondary",
                        block: ""
                    },
                    on: {
                        click: e.cancelImportTemplate
                    }
                }, [e._v(e._s(e.$t("cancel")) + " ")])], 1), s("div", {
                    staticClass: "col-6"
                }, [s("b-button", {
                    staticClass: "mt-3",
                    attrs: {
                        block: "",
                        variant: e.importedTemplate.front || e.importedTemplate.db || !e.importedTemplate.images || !e.importedTemplate.video ? "success" : "light",
                        disabled: !e.importedTemplate.front && !e.importedTemplate.db && !e.importedTemplate.video && !e.importedTemplate.images
                    },
                    on: {
                        click: e.importRequest
                    }
                }, [e._v(e._s(e.$t("import")) + " ")])], 1)])])], 1) : e._e()
            },
            wa = [],
            _a = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group text-left"
                }, [s("label", [e._v(e._s(e.$t("import_settings")))]), s("b-form-file", {
                    attrs: {
                        id: "import-settings-file-input",
                        "browse-text": e.$t("browse"),
                        placeholder: "...",
                        accept: ".exp"
                    },
                    on: {
                        change: function(t) {
                            return e.importSettingsTemplate(t)
                        }
                    }
                })], 1)]), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group text-left"
                }, [s("label", [e._v(e._s(e.$t("import_theme")))]), s("b-form-file", {
                    ref: "import-theme-file-input",
                    attrs: {
                        id: "import-theme-file-input",
                        "browse-text": e.$t("browse"),
                        placeholder: "...",
                        accept: ".zip"
                    },
                    on: {
                        change: function(t) {
                            return e.importTheme(t)
                        }
                    }
                })], 1)]), s("div", {
                    staticClass: "col-4"
                }, [s("fieldset", {
                    staticClass: "form-group text-right"
                }, [s("b-button", {
                    staticClass: "w-100",
                    staticStyle: {
                        "margin-top": "24px"
                    },
                    attrs: {
                        variant: "info",
                        size: "sm"
                    },
                    on: {
                        click: function(t) {
                            return e.exportSettings()
                        }
                    }
                }, [e._v(" " + e._s(e.$t("export_settings")) + " ")])], 1)])]), s("hr"), e.loadTheme ? s("div", {
                    staticClass: "loader"
                }, [e._m(0)]) : e._e()])
            },
            xa = [function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "spinner-border",
                    attrs: {
                        role: "status"
                    }
                }, [s("span", {
                    staticClass: "sr-only"
                }, [e._v("Loading...")])])
            }],
            ya = (s("2b3d"), {
                name: "SettingTemplate",
                data: function() {
                    return {
                        loadTheme: !1
                    }
                },
                methods: {
                    exportSettings: function() {
                        return Object(o["a"])(regeneratorRuntime.mark((function e() {
                            var t, s, r;
                            return regeneratorRuntime.wrap((function(e) {
                                while (1) switch (e.prev = e.next) {
                                    case 0:
                                        return e.next = 2, w.exportSettings();
                                    case 2:
                                        t = e.sent, s = window.URL.createObjectURL(new Blob([t])), r = document.createElement("a"), r.style.display = "none", r.href = s, r.download = "guestScreen.exp", document.body.appendChild(r), r.click(), window.URL.revokeObjectURL(s);
                                    case 11:
                                    case "end":
                                        return e.stop()
                                }
                            }), e)
                        })))()
                    },
                    importTheme: function(e) {
                        var t = this;
                        if (this.loadTheme = !0, e.target.files.length) {
                            var s = e.target.files[0],
                                r = new FileReader;
                            r.readAsDataURL(s), r.onload = function(e) {
                                var s = e.currentTarget.result.split(",").pop();
                                w.importTheme(s).then((function(e) {
                                    t.loadTheme = !1, e.error && t.$msg.error(e, t)
                                }))
                            }
                        }
                    },
                    importSettingsTemplate: function(e) {
                        var t = this;
                        if (e.target.files.length) {
                            var s = e.target.files[0],
                                r = new FileReader;
                            r.readAsDataURL(s), r.onload = function(e) {
                                var s = e.currentTarget.result.split(",").pop();
                                s = atob(s), w.importSettingsTemplate(s).then((function(e) {
                                    e.error && t.$msg.error(e, t)
                                }))
                            }
                        }
                    },
                    resetImportTheme: function() {
                        this.$refs["import-theme-file-input"].reset()
                    }
                }
            }),
            Ca = ya,
            ka = Object(I["a"])(Ca, _a, xa, !1, null, null, null),
            Sa = ka.exports,
            $a = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("nameType.dishNames")))]), s("value-select-custom", {
                    attrs: {
                        name: "dishNameType",
                        options: e.nameType
                    },
                    model: {
                        value: e.settings.dishNameType,
                        callback: function(t) {
                            e.$set(e.settings, "dishNameType", t)
                        },
                        expression: "settings.dishNameType"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("nameType.modiNames")))]), s("value-select-custom", {
                    attrs: {
                        name: "modiNameType",
                        options: e.nameType
                    },
                    model: {
                        value: e.settings.modiNameType,
                        callback: function(t) {
                            e.$set(e.settings, "modiNameType", t)
                        },
                        expression: "settings.modiNameType"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("nameType.orderCategoryNames")))]), s("value-select-custom", {
                    attrs: {
                        name: "orderCategoryType",
                        options: e.nameTypeShort
                    },
                    model: {
                        value: e.settings.orderCategoryType,
                        callback: function(t) {
                            e.$set(e.settings, "orderCategoryType", t)
                        },
                        expression: "settings.orderCategoryType"
                    }
                })], 1)])])])
            },
            Ra = [],
            ja = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("multiselect", {
                    attrs: {
                        id: e.name,
                        label: "text",
                        "track-by": "value",
                        options: e.options,
                        searchable: !1,
                        placeholder: "",
                        "show-labels": !1
                    },
                    model: {
                        value: e.selected,
                        callback: function(t) {
                            e.selected = t
                        },
                        expression: "selected"
                    }
                })
            },
            Ta = [],
            Oa = s("8e5f"),
            Pa = s.n(Oa),
            Na = {
                name: "ValueSelect2Custom",
                components: {
                    Multiselect: Pa.a
                },
                data: function() {
                    return {
                        selected: null
                    }
                },
                model: {
                    prop: "value",
                    event: "input"
                },
                props: {
                    value: {},
                    name: {
                        type: String,
                        required: !0
                    },
                    options: {
                        type: Array,
                        required: !0
                    }
                },
                watch: {
                    selected: {
                        handler: function(e) {
                            W.a.isNil(e) || this.$emit("input", e.value)
                        },
                        immediate: !0
                    },
                    value: {
                        handler: function(e) {
                            this.selected = this.options.find((function(t) {
                                return t.value === e
                            }))
                        },
                        immediate: !0
                    }
                }
            },
            La = Na,
            Da = Object(I["a"])(La, ja, Ta, !1, null, "5382bbd3", null),
            Fa = Da.exports,
            za = {
                name: "NameTypesSection",
                components: {
                    ValueSelectCustom: Fa
                },
                props: {
                    settings: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    }
                },
                data: function() {
                    return {
                        nameType: [{
                            value: "name",
                            text: this.$t("nameType.name")
                        }, {
                            value: "altName",
                            text: this.$t("nameType.altName")
                        }, {
                            value: "shortName",
                            text: this.$t("nameType.shortName")
                        }, {
                            value: "altShortName",
                            text: this.$t("nameType.altShortName")
                        }]
                    }
                },
                computed: {
                    nameTypeShort: function() {
                        return this.nameType.filter((function(e) {
                            return "name" === e.value || "altName" === e.value
                        }))
                    }
                }
            },
            Ma = za,
            Aa = Object(I["a"])(Ma, $a, Ra, !1, null, "d32d497c", null),
            Ia = Aa.exports,
            Ea = {
                name: "SettingGeneral",
                components: {
                    CustomMultiselect: er,
                    SettingTemplate: Sa,
                    NameTypesSection: Ia
                },
                props: {
                    settings: {
                        type: Object,
                        default: function() {
                            return {}
                        }
                    },
                    radioBoolOptions: {
                        type: Array,
                        default: function() {
                            return {}
                        }
                    }
                },
                data: function() {
                    return {
                        mediaSource: [{
                            text: this.$t("source_RK7"),
                            value: "FromRk7Parameter"
                        }, {
                            text: this.$t("local_directory"),
                            value: "FromLocalDir"
                        }, {
                            text: this.$t("ftp_server"),
                            value: "FromFtp"
                        }, {
                            text: this.$t("from_http"),
                            value: "FromHttp"
                        }],
                        languageList: ["ru", "en"],
                        selectedMediaSource: null,
                        mediaSourceRaws: {},
                        logLevels: [{
                            value: 1,
                            text: "1 - Error"
                        }, {
                            value: 2,
                            text: "2 - Warning"
                        }, {
                            value: 3,
                            text: "3 - Info"
                        }, {
                            value: 4,
                            text: "4 - Debug"
                        }, {
                            value: 5,
                            text: "5 - Trace"
                        }],
                        dateFormatList: null,
                        importedTemplate: {
                            fileData: null,
                            db: !1,
                            front: !1,
                            video: !1,
                            images: !1,
                            selector: !1,
                            importParams: []
                        },
                        selectedLog: null,
                        dateFormat: null,
                        fontDefault: null,
                        fontList: [],
                        fontsUploadFolder: fe,
                        stateWatcher: !1,
                        watcherCount: 0,
                        loaded: !1
                    }
                },
                created: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        var s, r, n;
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, e.getDateFormats();
                                case 2:
                                    return s = e.logLevels.findIndex((function(t) {
                                        return t.value === e.settings.logLevel
                                    })), e.selectedLog = e.logLevels[s], r = e.dateFormatList.findIndex((function(t) {
                                        return t.text === e.settings.dateFormat
                                    })), e.dateFormat = e.dateFormatList[r], n = e.mediaSource.findIndex((function(t) {
                                        return t.value === e.settings.mediaSourceType
                                    })), e.selectedMediaSource = e.mediaSource[n], e.mediaSourceRaws = e.settings.mediaSourceRaw, t.next = 11, e.getFonts();
                                case 11:
                                    return t.next = 13, e.getLanguageList();
                                case 13:
                                    return t.next = 15, D.change(e.settings.language);
                                case 15:
                                    return t.next = 17, e.getWatcherStatus(10);
                                case 17:
                                    e.loaded = !0;
                                case 18:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    rkExtPropNamesValidation: function(e) {
                        this.settings.rkExtPropNames = e.trim().replace(/[^0-9a-z]/g, "")
                    },
                    getLanguageList: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, b.getLocaleList();
                                    case 2:
                                        s = t.sent, s.error ? e.$msg.error(s.error, e) : e.languageList = s;
                                    case 4:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    getFonts: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.fontList();
                                    case 2:
                                        e.fontList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    getDateFormats: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, G.getDateFormats();
                                    case 2:
                                        e.dateFormatList = t.sent;
                                    case 3:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    startWatcher: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        w.startWatcher().then((function(t) {
                                            t.error ? e.$msg.error(t, e) : e.checkWatcher("start")
                                        }));
                                    case 1:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    stopWatcher: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        w.stopWatcher().then((function(t) {
                                            t.error ? e.$msg.error(t, e) : e.checkWatcher("stop")
                                        }));
                                    case 1:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    checkWatcher: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        if (r = 0, e) {
                                            s.next = 4;
                                            break
                                        }
                                        return t.getWatcherStatus(), s.abrupt("return");
                                    case 4:
                                        t.intervalid1 = setInterval((function() {
                                            return "start" === e && t.stateWatcher ? (clearInterval(t.intervalid1), void t.$msg.success("Watcher started", t)) : "stop" !== e || t.stateWatcher ? (r++, void(r > 2 ? clearInterval(t.intervalid1) : t.getWatcherStatus())) : (clearInterval(t.intervalid1), void t.$msg.success("Watcher stopped", t))
                                        }), 1e3);
                                    case 5:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    getWatcherStatus: function() {
                        var e = this;
                        w.checkWatcher().then((function(t) {
                            t.error ? e.$msg.error(t, e) : e.stateWatcher = t
                        }))
                    },
                    importSelectFile: function(e) {
                        var t = this,
                            s = e.target.files[0],
                            r = new FileReader;
                        r.readAsDataURL(s), r.onload = function(e) {
                            var s = e.currentTarget.result.split(",").pop();
                            t.importedTemplate.fileData = atob(s), t.importTemplate()
                        }
                    },
                    cancelImportTemplate: function() {
                        this.importedTemplate.fileData = null, this.importedTemplate.db = !1, this.importedTemplate.front = !1, this.importedTemplate.video = !1, this.importedTemplate.images = !1, this.importedTemplate.selector = !1, this.importedTemplate.importParams = [], this.$refs["settings-template"].resetImportTheme()
                    },
                    importTemplate: function() {
                        var e = this;
                        w.importFile(this.importedTemplate.fileData).then((function(t) {
                            t.error ? e.$msg.error(t, e) : (e.importedTemplate.importParams = t.content, e.importedTemplate.selector = !0)
                        }))
                    },
                    importRequest: function() {
                        var e = this,
                            t = [];
                        this.importedTemplate.front && t.push("front"), this.importedTemplate.db && t.push("db"), this.importedTemplate.video && t.push("video"), this.importedTemplate.images && t.push("images"), w.importRequest(t).then((function(t) {
                            t.error ? e.$msg.error(t, e) : (e.$msg.success(e.$t("data_successfully_imported"), e), e.$forceUpdate()), e.importedTemplate.fileData = null, e.importedTemplate.db = !1, e.importedTemplate.front = !1, e.importedTemplate.images = !1, e.importedTemplate.video = !1, e.importedTemplate.selector = !1, e.importedTemplate.importParams = []
                        })), this.$refs["settings-template"].resetImportTheme()
                    },
                    readFileUrl: function(e) {
                        var t = this,
                            s = Array.from(e.target.files),
                            r = s.length;
                        if (this.uploadFonts = [], r) {
                            var n = e.target.files[0].name.split(".");
                            if (n.length > 1) {
                                var a = n[n.length - 1],
                                    o = ["woff", "woff2", "ttf", "svg", "otf"];
                                if (-1 === o.indexOf(a)) return this.$refs["font-input"].reset(), void this.$msg.error(this.$t("invalid_font_file"), this)
                            }
                            var i = 0;
                            Array.from(s).forEach((function(e) {
                                var s = new FileReader;
                                s.readAsDataURL(e), s.onload = function(s) {
                                    t.uploadFonts.push({
                                        raw: s.currentTarget.result.split(",").pop(),
                                        name: e.name
                                    }), i++, i === r && (t.$refs["font-input"].reset(), S.uploadMedia({
                                        dir: t.fontsUploadFolder,
                                        files: t.uploadFonts,
                                        overwrite: !0
                                    }).then((function(e) {
                                        t.$msg.success(t.$t("font_uploaded"), t), t.getFonts()
                                    })).catch((function(e) {
                                        t.$msg.success(t.$t("font_loading_error"), t), t.getFonts()
                                    })))
                                }
                            }))
                        }
                    }
                }
            },
            Ba = Ea,
            Ha = (s("8ff3"), Object(I["a"])(Ba, ba, wa, !1, null, null, null)),
            Va = Ha.exports,
            Ua = {
                name: "Settings",
                components: {
                    CustomMultiselect: er,
                    SettingServers: aa,
                    SettingScreens: ma,
                    SettingConnection: ha,
                    SettingGeneral: Va
                },
                data: function() {
                    return {
                        loaded: !1,
                        radioBoolOptions: [{
                            text: this.$t("on"),
                            value: !0
                        }, {
                            text: this.$t("off"),
                            value: !1
                        }],
                        settings: null,
                        refs: ne(),
                        modalShow: !1,
                        activeTab: "general",
                        selectorCashStations: !1,
                        selectedMonitor: {},
                        lic: {
                            objLoaded: !1,
                            objList: [],
                            objSelector: !1,
                            objSearch: "",
                            dealerTocken: null,
                            tabIndex: 0,
                            generated: !1,
                            user: null,
                            license: null,
                            master: null,
                            password: null,
                            list: [],
                            masterList: [],
                            screens: null,
                            dealerObj: {
                                id: "",
                                name: ""
                            },
                            error: {
                                text: null,
                                desc: null
                            }
                        }
                    }
                },
                computed: {
                    licKey: function() {
                        return _e.state.licKey
                    },
                    filteredList: function() {
                        var e = this;
                        return this.lic.objList.filter((function(t) {
                            return t.name = t.name ? t.name : "", t.name.toLowerCase().includes(e.lic.objSearch.toLowerCase()) || t.id.toString().includes(e.lic.objSearch)
                        }))
                    }
                },
                created: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return e.$store.commit("setPageTitle", e.$t("settings")), t.next = 3, w.getList();
                                case 3:
                                    return e.settings = t.sent, t.next = 6, G.createFromRaw(e.settings);
                                case 6:
                                    return e.settings = t.sent, t.next = 9, G.getScreensList();
                                case 9:
                                    return e.screens = t.sent, t.next = 12, e.prepareMediaSourceRaw(e.settings.mediaSourceRaw);
                                case 12:
                                    e.settings.mediaSourceRaw = t.sent, e.loaded = !0;
                                case 14:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    changeScreens: function(e) {
                        this.screens = e
                    },
                    updateSettings: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r, n, o, i, c;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return s = [], e.settings.mediaSourceRaw = e.prepareMediaSource(), t.next = 4, G.save(e.settings);
                                    case 4:
                                        return r = t.sent, r.error && s.push(r), t.next = 8, G.saveScreens(e.screens);
                                    case 8:
                                        if (n = t.sent, n.error && s.push(n), s.length < 1) e.$msg.success(e.$t("setting_saved") + "!", e), Q(e.settings), localStorage.language = e.settings.language, localStorage.dateFormat = e.settings.dateFormat, e.$router.push({
                                            name: "modes"
                                        }), location.reload();
                                        else {
                                            o = Object(a["a"])(s);
                                            try {
                                                for (o.s(); !(i = o.n()).done;) c = i.value, e.$msg.error(c, e)
                                            } catch (c) {
                                                o.e(c)
                                            } finally {
                                                o.f()
                                            }
                                        }
                                    case 11:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    prepareMediaSourceRaw: function(e) {
                        var t, s = {},
                            r = Object(a["a"])(e);
                        try {
                            for (r.s(); !(t = r.n()).done;) {
                                var n = t.value;
                                n && (s[n.type] = n)
                            }
                        } catch (o) {
                            r.e(o)
                        } finally {
                            r.f()
                        }
                        return s
                    },
                    prepareMediaSource: function() {
                        var e = [];
                        return e.push(this.settings.mediaSourceRaw["FromRk7Parameter"]), e.push(this.settings.mediaSourceRaw["FromLocalDir"]), e.push(this.settings.mediaSourceRaw["FromFtp"]), e.push(this.settings.mediaSourceRaw["FromHttp"]), e
                    },
                    tabChange: function(e) {
                        this.activeTab = e
                    },
                    linkClass: function(e) {
                        return this.lic.tabIndex === e ? ["bg-info", "text-white"] : ["bg-white", "text-info"]
                    },
                    dealerAuth: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return e.lic.error.text = null, e.lic.error.desc = null, s = {
                                            login: e.lic.user,
                                            password: e.lic.password
                                        }, t.next = 5, b.dealerLogin(s, "dealerLogin");
                                    case 5:
                                        r = t.sent, r.error ? (e.lic.error.text = e.$t("authorisation_error") + ".", e.lic.error.desc = r.desc, e.lic.dealerTocken = null) : e.lic.dealerTocken = r;
                                    case 7:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    getLicenceList: function(e) {
                        var t = this,
                            s = {
                                objectId: this.lic.dealerObj.id,
                                token: e
                            };
                        b.getAllGsLicenses(s, "getAllGsLicenses").then((function(e) {
                            e.error ? t.$msg.error(e, t) : t.lic.list = e
                        }))
                    },
                    getMasterList: function(e) {
                        var t = this,
                            s = {
                                objectId: this.lic.dealerObj.id,
                                token: e
                            };
                        b.getAllGsMasterLicenses(s, "getAllGsMasterLicenses").then((function(e) {
                            e["error"] ? t.$msg.error(e, t) : t.lic.masterList = e
                        }))
                    },
                    generateLicense: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s, r;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        if (e.lic.generated = !1, e.lic.master) {
                                            t.next = 4;
                                            break
                                        }
                                        return e.$msg.error(e.$t("choose_a_master_license"), e), t.abrupt("return");
                                    case 4:
                                        return s = {
                                            objectId: e.lic.dealerObj.id,
                                            token: e.lic.dealerTocken,
                                            license: e.lic.master
                                        }, t.next = 7, b.generateLicense(s, "generateLicense");
                                    case 7:
                                        if (r = t.sent, r.error) {
                                            t.next = 18;
                                            break
                                        }
                                        return e.lic.generated = e.$t("license_successfully_obtained") + "!", t.next = 12, e.getMasterList(e.lic.dealerTocken);
                                    case 12:
                                        return t.next = 14, e.getLicenceList(e.lic.dealerTocken);
                                    case 14:
                                        e.$msg.success("OK", e), e.$forceUpdate(), t.next = 19;
                                        break;
                                    case 18:
                                        e.$msg.error(r, e);
                                    case 19:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    initGsLicense: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        if (e.lic.generated = !1, s = {
                                                objectId: e.lic.dealerObj.id,
                                                token: e.lic.dealerTocken,
                                                key: e.lic.license.key
                                            }, e.lic.license) {
                                            t.next = 5;
                                            break
                                        }
                                        return e.$msg.error(e.$t("choose_a_master_license"), e), t.abrupt("return");
                                    case 5:
                                        b.initGsLicense(s, "initGsLicense").then((function(t) {
                                            t.error ? e.$msg.error(t, e) : e.lic.generated = e.$t("license_successfully_obtained") + "!"
                                        }));
                                    case 6:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    deleteLicense: function() {
                        var e = this;
                        b.deleteLicense("deleteLicense").then((function(t) {
                            t.error ? (e.modalShow = !1, e.$msg.error(t.error, e)) : (e.modalShow = !1, e.$router.push({
                                name: "screen"
                            }))
                        }))
                    },
                    getDealerObjects: function() {
                        var e = this;
                        this.lic.objLoaded = !1;
                        var t = {
                            token: this.lic.dealerTocken
                        };
                        b.getDealerObjects(t, "getDealerObjects").then((function(t) {
                            t.error ? (e.lic.objSelector = !1, e.lic.objLoaded = !1, e.$msg.error(t, e)) : (e.lic.objLoaded = !0, e.lic.objList = t)
                        }))
                    },
                    openDealerSelector: function() {
                        this.lic.objSelector = !0, this.getDealerObjects()
                    },
                    closeDealerSelector: function() {
                        this.lic.objSelector = !1, this.lic.objSearch = ""
                    },
                    selectDealerObj: function(e) {
                        this.lic.dealerObj = e, this.lic.objSelector = !1, this.lic.objSearch = "", this.getLicenceList(this.lic.dealerTocken), this.getMasterList(this.lic.dealerTocken)
                    }
                }
            },
            qa = Ua,
            Wa = (s("5c48"), Object(I["a"])(qa, Qn, Jn, !1, null, null, null)),
            Ya = Wa.exports,
            Ga = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    attrs: {
                        id: "auth"
                    }
                }, [s("div", {
                    staticClass: "auth-block"
                }, [s("form", {
                    on: {
                        submit: function(t) {
                            return t.preventDefault(), e.auth(t)
                        }
                    }
                }, [s("div", {
                    staticClass: "ttl"
                }, [e._v(" Авторизация ")]), s("p", {
                    staticClass: "text-center alert-warning p-1"
                }, [e._v("Просьба в качестве логина использовать e-mail, указанный в карточке пользователя лицензирования")]), e.error.text ? s("div", {
                    staticClass: "error"
                }, [e._v(" " + e._s(e.error.text)), s("br"), e._v(" " + e._s(e.error.desc) + " ")]) : e._e(), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    staticStyle: {
                        display: "none"
                    },
                    attrs: {
                        for: "login"
                    }
                }), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.user,
                        expression: "user"
                    }],
                    staticClass: "form-control",
                    attrs: {
                        id: "login",
                        placeholder: e.$t("login")
                    },
                    domProps: {
                        value: e.user
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || (e.user = t.target.value)
                        }
                    }
                })]), s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    staticStyle: {
                        display: "none"
                    },
                    attrs: {
                        for: "password"
                    }
                }), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.password,
                        expression: "password"
                    }],
                    staticClass: "form-control",
                    attrs: {
                        id: "password",
                        type: "password",
                        placeholder: e.$t("password")
                    },
                    domProps: {
                        value: e.password
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || (e.password = t.target.value)
                        }
                    }
                })])]), s("button", {
                    staticClass: "login-btn mdi mdi-login-variant",
                    attrs: {
                        variant: "success"
                    }
                })])])]), s("div", {
                    staticClass: "row mt-5"
                }, [s("div", {
                    staticClass: "col"
                }, [s("div", {
                    staticClass: "back-to-screen",
                    on: {
                        click: function(t) {
                            return e.toScreen()
                        }
                    }
                }, [e._v("Назад")])])])])
            },
            Xa = [],
            Za = {
                name: "Modes",
                data: function() {
                    return {
                        user: null,
                        password: null,
                        error: {
                            text: null,
                            desc: null
                        }
                    }
                },
                methods: {
                    auth: function() {
                        var e = this;
                        this.error.text = null, this.error.desc = null;
                        var t = {
                            login: this.user,
                            password: this.password
                        };
                        b.dealerLogin(t, "dealerLogin").then((function(t) {
                            t.error ? (e.error.text = "Ошибка авторизации.", e.error.desc = t.desc) : (e.$store.commit("setToken", t), e.$router.push({
                                name: "get-license"
                            }))
                        }))
                    },
                    toScreen: function() {
                        this.$router.push({
                            name: "screen"
                        })
                    }
                }
            },
            Ka = Za,
            Qa = (s("ce00"), Object(I["a"])(Ka, Ga, Xa, !1, null, null, null)),
            Ja = Qa.exports,
            eo = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "get-license bg-light pb-5",
                    staticStyle: {
                        "min-height": "100vh"
                    }
                }, [s("div", {
                    staticClass: "header"
                }, [e._v("Guest_Screen")]), s("div", {
                    staticClass: "get-license-content mb-4"
                }, [s("div", {
                    staticClass: "ttl bg-dark"
                }, [e._v(e._s(e.$t("license_page.select_obj")))]), s("div", {
                    staticClass: "get-license-form"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("object")) + ":")]), s("br"), e.dealerObj.id ? s("div", [s("span", {
                    staticClass: "text-info"
                }, [e._v(e._s(e.dealerObj.name))]), s("br"), s("span", {
                    staticClass: "small font-weight-bold"
                }, [e._v(e._s(e.dealerObj.id))]), s("br")]) : e._e(), e.dealerObj.id ? e._e() : s("div", {
                    staticClass: "text-center small text-danger bg-light mt-2 py-1"
                }, [e._v(e._s(e.$t("license_page.obj_in_not_selected")))])])]), s("div", {
                    staticClass: "offset-1 col-5"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [e._m(0), s("br"), s("b-button", {
                    attrs: {
                        variant: "info",
                        type: "button"
                    },
                    on: {
                        click: e.openDealerSelector
                    }
                }, [e._v(" " + e._s(e.$t("choose")) + " ")])], 1)])])])]), s("div", {
                    staticClass: "get-license-content mb-4",
                    class: {
                        collapsed: "old" !== e.licType || null == e.licType
                    }
                }, [s("div", {
                    staticClass: "ttl bg-info",
                    on: {
                        click: function(t) {
                            return e.selectLicType("old")
                        }
                    }
                }, [e._v(e._s(e.$t("bind_existing_license")) + " ")]), s("div", {
                    staticClass: "get-license-form"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 small mb-3 text-danger"
                }, [s("span", {
                    staticClass: "font-weight-bold"
                }, [e._v(e._s(e.$t("attention")) + "!")]), s("br"), e._v(" " + e._s(e.$t("restore_db")) + ". ")])]), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "licence"
                    }
                }, [e._v(e._s(e.$t("list_of_licenses")) + ":")]), s("br"), s("select", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.licence,
                        expression: "licence"
                    }],
                    staticClass: "form-control",
                    attrs: {
                        id: "licence",
                        name: "licence"
                    },
                    on: {
                        change: function(t) {
                            var s = Array.prototype.filter.call(t.target.options, (function(e) {
                                return e.selected
                            })).map((function(e) {
                                var t = "_value" in e ? e._value : e.value;
                                return t
                            }));
                            e.licence = t.target.multiple ? s : s[0]
                        }
                    }
                }, e._l(e.licenceList, (function(t) {
                    return s("option", {
                        key: t.key,
                        domProps: {
                            value: t
                        }
                    }, [e._v(e._s(t.key))])
                })), 0)]), e.licence ? s("div", {
                    staticClass: "small text-info font-weight-bold"
                }, [e._v("до: " + e._s(e.licence.expirationDate))]) : e._e()]), s("div", {
                    staticClass: "offset-1 col-5"
                }, [s("label"), s("br"), s("b-button", {
                    staticClass: "float-right",
                    attrs: {
                        variant: "success",
                        type: "button"
                    },
                    on: {
                        click: function(t) {
                            return e.initGsLicense()
                        }
                    }
                }, [e._v(" " + e._s(e.$t("binding")) + " ")])], 1)])])]), s("div", {
                    staticClass: "get-license-content",
                    class: {
                        collapsed: "new" !== e.licType || null == e.licType
                    }
                }, [s("div", {
                    staticClass: "ttl",
                    on: {
                        click: function(t) {
                            return e.selectLicType("new")
                        }
                    }
                }, [e._v(e._s(e.$t("get_a_new")) + " ")]), s("div", {
                    staticClass: "get-license-form"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-md-12 col-lg-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("choose_a_master_license")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.masterList,
                        label: "productName",
                        "close-on-select": !0,
                        "show-labels": !1
                    },
                    scopedSlots: e._u([{
                        key: "option",
                        fn: function(t) {
                            return [s("div", [e._v(e._s(t.option["productName"])), s("br"), s("span", {
                                staticClass: "small font-weight-bold mt-1"
                            }, [e._v(" " + e._s(e.$t("time_left")) + ": " + e._s(t.option["qty"] - t.option["qtyUsed"]) + " из " + e._s(t.option["qty"]) + " ")]), s("br"), s("span", {
                                staticClass: "small font-weight-bold"
                            }, [e._v(" " + e._s(e.$t("valid_until")) + ": " + e._s(t.option["expirationDate"]) + " ")])])]
                        }
                    }]),
                    model: {
                        value: e.master,
                        callback: function(t) {
                            e.master = t
                        },
                        expression: "master"
                    }
                })], 1), s("button", {
                    staticClass: "btn btn-info mdi mdi-login-variant float-right",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: e.generateLicense
                    }
                }, [e._v(" " + e._s(e.$t("generate")) + " ")])])])])]), e.objSelector ? s("div", {
                    staticClass: "obj-selector-overlay"
                }, [s("div", {
                    staticClass: "obj-selector"
                }, [s("div", {
                    staticClass: "ttl"
                }, [e._v(e._s(e.$t("object_selection")))]), s("div", {
                    staticClass: "object-list-search"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-sm-3"
                }), s("div", {
                    staticClass: "col-sm-6"
                }, [s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.search,
                        expression: "search"
                    }],
                    staticClass: "form-control",
                    attrs: {
                        type: "text",
                        placeholder: e.$t("search") + "..."
                    },
                    domProps: {
                        value: e.search
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || (e.search = t.target.value)
                        }
                    }
                })])])]), e.objLoaded ? s("div", {
                    staticClass: "object-list"
                }, e._l(e.filteredList, (function(t) {
                    return s("div", {
                        key: t.id,
                        staticClass: "item",
                        on: {
                            click: function(s) {
                                return e.selectDealerObj(t)
                            }
                        }
                    }, [s("div", {
                        staticClass: "name"
                    }, [e._v(e._s(t.name))]), s("div", {
                        staticClass: "id"
                    }, [e._v(e._s(t.id))])])
                })), 0) : e._e(), e.objLoaded ? e._e() : s("div", {
                    staticClass: "loading"
                }, [s("div", {
                    staticClass: "loader mdi mdi-hexagon-multiple mdi-spin"
                })]), s("div", {
                    staticClass: "close-selector mdi mdi-close",
                    on: {
                        click: function(t) {
                            return e.closeDealerSelector()
                        }
                    }
                })])]) : e._e()])
            },
            to = [function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("label", [s("br")])
            }],
            so = (s("841c"), {
                name: "Modes",
                components: {
                    CustomMultiselect: er
                },
                data: function() {
                    return {
                        search: "",
                        token: null,
                        objList: [],
                        dealerObj: {
                            id: null,
                            name: null
                        },
                        maxDate: null,
                        licence: null,
                        licenceList: [],
                        masterList: [],
                        master: null,
                        objSelector: !1,
                        objLoaded: !1,
                        licType: null
                    }
                },
                computed: {
                    filteredList: function() {
                        var e = this;
                        return this.objList.filter((function(t) {
                            return t.name = t.name ? t.name : "", t.name.toLowerCase().includes(e.search.toLowerCase()) || t.id.toString().includes(e.search)
                        }))
                    }
                },
                created: function() {
                    this.getToken(), this.maxDate = this.getTudayDate()
                },
                methods: {
                    openDealerSelector: function() {
                        this.objSelector = !0, this.getDealerObjects()
                    },
                    closeDealerSelector: function() {
                        this.objSelector = !1, this.search = ""
                    },
                    selectDealerObj: function(e) {
                        this.dealerObj = e, this.objSelector = !1, this.search = "", this.getLicenceList(), this.getMasterList()
                    },
                    getToken: function() {
                        this.token = _e.state.token, this.token || this.$router.push({
                            name: "auth"
                        })
                    },
                    getDealerObjects: function() {
                        var e = this;
                        this.objLoaded = !1;
                        var t = {
                            token: this.token
                        };
                        b.getDealerObjects(t, "getDealerObjects").then((function(t) {
                            t.error ? (e.objSelector = !1, e.objLoaded = !1, e.$msg.error(t, e)) : (e.objLoaded = !0, e.objList = t)
                        }))
                    },
                    getMaxDate: function() {
                        var e = this,
                            t = {
                                objectId: this.dealerObj.id,
                                token: this.token
                            };
                        t.objectId ? b.getMaxDate(t, "getMaxDate").then((function(t) {
                            t.error ? e.$msg.error(t, e) : e.maxDate = t.maxDate
                        })) : this.$msg.error(this.$t("license_page.error_obj_in_not_selected"), this)
                    },
                    generateLicense: function() {
                        var e = this;
                        if (this.dealerObj && this.token && this.master) {
                            var t = {
                                objectId: this.dealerObj.id,
                                token: this.token,
                                license: this.master
                            };
                            b.generateLicense(t, "generateLicense").then((function(t) {
                                t.error ? e.$msg.error(t, e) : (e.$msg.success(e.$t("license_page.message_lic_got"), e), e.$router.push({
                                    name: "screen"
                                }))
                            }))
                        } else this.$msg.error(this.$t("license_page.error_select_obj_m_lic"), this)
                    },
                    getTudayDate: function() {
                        var e = new Date,
                            t = e.getDate(),
                            s = e.getMonth() + 1,
                            r = e.getFullYear();
                        return t < 10 && (t = "0" + t), s < 10 && (s = "0" + s), e = r + "-" + s + "-" + t, e
                    },
                    getLicenceList: function() {
                        var e = this;
                        if (this.dealerObj) {
                            var t = {
                                objectId: this.dealerObj.id,
                                token: this.token
                            };
                            b.getAllGsLicenses(t, "getAllGsLicenses").then((function(t) {
                                t.error ? e.$msg.error(t, e) : e.licenceList = t
                            }))
                        } else this.$msg.error(this.$t("license_page.error_obj_in_not_selected"), this)
                    },
                    getMasterList: function() {
                        var e = this;
                        if (this.dealerObj) {
                            var t = {
                                objectId: this.dealerObj.id,
                                token: this.token
                            };
                            b.getAllGsMasterLicenses(t, "getAllGsMasterLicenses").then((function(t) {
                                t.error ? e.$msg.error(t, e) : e.masterList = t
                            }))
                        } else this.$msg.error(this.$t("license_page.error_obj_in_not_selected"), this)
                    },
                    initGsLicense: function() {
                        var e = this,
                            t = {
                                objectId: this.dealerObj.id,
                                token: this.token,
                                key: this.licence.key
                            };
                        t.objectId && t.token && t.key ? b.initGsLicense(t, "initGsLicense").then((function(t) {
                            t.error ? e.$msg.error(t, e) : (e.$msg.success(e.$t("license_page.message_lic_got_success"), e), e.$router.push({
                                name: "screen"
                            }))
                        })) : this.$msg.error(this.$t("license_page.error_select_obj_lic"), this)
                    },
                    selectLicType: function(e) {
                        this.dealerObj.id ? e === this.licType ? this.licType = null : this.licType = e : this.$msg.error(this.$t("license_page.error_obj_in_not_selected"), this)
                    }
                }
            }),
            ro = so,
            no = (s("c3a5"), Object(I["a"])(ro, eo, to, !1, null, null, null)),
            ao = no.exports,
            oo = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-sm-5"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("beginning_of_work")))]), s("date-picker", {
                    attrs: {
                        config: e.dateOptions
                    },
                    model: {
                        value: e.from,
                        callback: function(t) {
                            e.from = t
                        },
                        expression: "from"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-sm-5"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("end_of_work")))]), s("date-picker", {
                    attrs: {
                        config: e.dateOptions
                    },
                    model: {
                        value: e.to,
                        callback: function(t) {
                            e.to = t
                        },
                        expression: "to"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-sm-2"
                }, [s("br"), s("button", {
                    staticClass: "btn btn-primary",
                    attrs: {
                        type: "button"
                    },
                    on: {
                        click: function(t) {
                            return e.getVotes()
                        }
                    }
                }, [e._v(e._s(e.$t("search")) + " ")])])]), s("br"), e.voteList.length < 1 ? s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 text-center py-3 text-muted"
                }, [e._v(" " + e._s(e.$t("no_data-for_the_current_period")) + " ")])]) : e._e(), e.voteList.length > 1 ? s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12"
                }, [s("table", {
                    staticClass: "table table-hover table-striped"
                }, [s("thead", [s("tr", [s("th", [e._v("#")]), s("th", [e._v(e._s(e.$t("vote.date")))]), s("th", [e._v(e._s(e.$t("vote.time")))]), s("th", [e._v(e._s(e.$t("vote.name")))]), s("th", [e._v(e._s(e.$t("vote.value")))])])]), e.voteList ? s("tbody", e._l(e.voteList, (function(t, r) {
                    return s("tr", {
                        key: r
                    }, [s("td", [e._v(e._s(r))]), s("td", [e._v(e._s(e.formatDate(t.dts)))]), s("td", [e._v(e._s(e.formatDate(t.dts, "time")))]), s("td", [e._v(e._s(t.raw.waiter.name))]), s("td", {
                        staticClass: "text-center"
                    }, [e._v(e._s(t.raw.value))])])
                })), 0) : e._e()])])]) : e._e()])
            },
            io = [],
            co = s("133f"),
            lo = s.n(co),
            uo = (s("ca56"), s("c1df")),
            mo = s.n(uo),
            po = {
                name: "Votes",
                components: {
                    datePicker: lo.a
                },
                data: function() {
                    return {
                        voteList: [],
                        fromModel: null,
                        toModel: null
                    }
                },
                created: function() {
                    this.$store.commit("setPageTitle", this.$t("performance_assessment_results")), this.getVotes()
                },
                computed: {
                    formatDateFromSettings: function() {
                        return localStorage.dateFormat.toUpperCase()
                    },
                    to: {
                        get: function() {
                            return this.toModel ? this.toModel : mo()().format(this.formatDateFromSettings)
                        },
                        set: function(e) {
                            this.toModel = e
                        }
                    },
                    from: {
                        get: function() {
                            return this.fromModel ? this.fromModel : mo()().subtract(1, "days").format(this.formatDateFromSettings)
                        },
                        set: function(e) {
                            this.fromModel = e
                        }
                    },
                    dateOptions: function() {
                        return {
                            format: this.formatDateFromSettings,
                            useCurrent: !1,
                            showClear: !0,
                            showClose: !0,
                            showTodayButton: !0,
                            locale: localStorage.language,
                            timeZone: "Europe/Moscow",
                            icons: {
                                time: "mdi mdi-clock",
                                date: "mdi mdi-calendar",
                                up: "mdi mdi-chevron-up",
                                down: "mdi mdi-chevron-down",
                                previous: "mdi mdi-arrow-left-drop-circle-outline",
                                next: "mdi mdi-arrow-right-drop-circle-outline",
                                today: "mdi mdi-calendar-check",
                                clear: "mdi mdi-delete",
                                close: "mdi mdi-close"
                            }
                        }
                    }
                },
                methods: {
                    getVotes: function() {
                        var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                            var t;
                            return regeneratorRuntime.wrap((function(e) {
                                while (1) switch (e.prev = e.next) {
                                    case 0:
                                        return t = {
                                            from: this.from,
                                            to: this.to
                                        }, e.next = 3, b.getVotesForPeriod(t);
                                    case 3:
                                        this.voteList = e.sent;
                                    case 4:
                                    case "end":
                                        return e.stop()
                                }
                            }), e, this)
                        })));

                        function t() {
                            return e.apply(this, arguments)
                        }
                        return t
                    }(),
                    formatDate: function(e, t) {
                        return "time" === t ? mo()(e).format("HH:mm") : mo()(e).format(this.formatDateFromSettings)
                    }
                }
            },
            fo = po,
            vo = Object(I["a"])(fo, oo, io, !1, null, "74e09a9b", null),
            go = vo.exports,
            ho = function() {
                var e = this,
                    t = e.$createElement,
                    r = e._self._c || t;
                return r("div", {
                    staticClass: "error-404"
                }, [r("div", {
                    staticClass: "text-block"
                }, [r("img", {
                    staticClass: "img",
                    attrs: {
                        src: s("e0b0"),
                        alt: "cat"
                    }
                }), r("span", [e._v("404")]), r("router-link", {
                    attrs: {
                        to: "/"
                    }
                }, [r("i", {
                    staticClass: "mdi mdi-home mdi-18px"
                }), e._v(" На главную")])], 1)])
            },
            bo = [],
            wo = (s("d2ef"), {}),
            _o = Object(I["a"])(wo, ho, bo, !1, null, null, null),
            xo = _o.exports,
            yo = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "page-edit-scenario"
                }, [s("div", {
                    staticClass: "container page"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-2 ttl"
                }, [e._v(" " + e._s(e.modeName) + " ")]), s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", {
                    attrs: {
                        for: "conditionsSet-name"
                    }
                }, [e._v(e._s(e.$t("name")))]), s("input", {
                    directives: [{
                        name: "model",
                        rawName: "v-model",
                        value: e.conditionsSet.name,
                        expression: "conditionsSet.name"
                    }],
                    staticClass: "form-control form-control-sm",
                    attrs: {
                        id: "conditionsSet-name"
                    },
                    domProps: {
                        value: e.conditionsSet.name
                    },
                    on: {
                        input: function(t) {
                            t.target.composing || e.$set(e.conditionsSet, "name", t.target.value)
                        }
                    }
                })])])]), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [e._v(e._s(e.$t("block")))]), s("div", {
                    staticClass: "col-6"
                }, [e._v(e._s(e.$t("scene")))]), e._l(e.blocks, (function(t) {
                    return s("div", {
                        key: t.id,
                        staticClass: "col-12 mt-2"
                    }, [s("div", {
                        staticClass: "row"
                    }, [s("div", {
                        staticClass: "col-6"
                    }, [s("div", [e._v(e._s(t.name))])]), s("div", {
                        staticClass: "col-6"
                    }, [s("vue-multiselect", {
                        attrs: {
                            options: e.scenes,
                            searchable: !1,
                            "allow-empty": !0,
                            label: "name + '/' + type",
                            "close-on-select": !0,
                            "hide-selected": "",
                            "show-labels": !1
                        },
                        on: {
                            close: function(s) {
                                return e.changeScene(t.id)
                            }
                        },
                        scopedSlots: e._u([{
                            key: "singleLabel",
                            fn: function(r) {
                                r.option;
                                return [e.selectedScene[t.id].guid ? s("span", [e._v(e._s(e.selectedScene[t.id].name) + " / " + e._s(e.selectedScene[t.id].type))]) : e._e(), e.selectedScene[t.id].guid ? e._e() : s("span", [e._v(e._s(e.$t("choose_scene")))])]
                            }
                        }, {
                            key: "option",
                            fn: function(t) {
                                var s = t.option;
                                return [e._v(" " + e._s(s.name) + " / " + e._s(s.type) + " ")]
                            }
                        }], null, !0),
                        model: {
                            value: e.selectedScene[t.id],
                            callback: function(s) {
                                e.$set(e.selectedScene, t.id, s)
                            },
                            expression: "selectedScene[block.id]"
                        }
                    })], 1)])])
                }))], 2), s("hr"), e.conditionsSet.workTime ? s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-3 ttl"
                }, [e._v(e._s(e.$t("scenario_run_time")))]), s("div", {
                    staticClass: "col-12"
                }, [s("b-form-radio-group", {
                    attrs: {
                        id: "workTime-enabled",
                        size: "sm",
                        options: e.radioBoolOptions,
                        buttons: "",
                        "button-variant": "outline-info",
                        name: "radio-btn-outline"
                    },
                    model: {
                        value: e.conditionsSet.workTime.enabled,
                        callback: function(t) {
                            e.$set(e.conditionsSet.workTime, "enabled", t)
                        },
                        expression: "conditionsSet.workTime.enabled"
                    }
                })], 1), s("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: e.conditionsSet.workTime.enabled,
                        expression: "conditionsSet.workTime.enabled"
                    }],
                    staticClass: "col-sm-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("beginning_of_work")))]), s("date-picker", {
                    attrs: {
                        config: e.dateOptions
                    },
                    model: {
                        value: e.conditionsSet.workTime.from,
                        callback: function(t) {
                            e.$set(e.conditionsSet.workTime, "from", t)
                        },
                        expression: "conditionsSet.workTime.from"
                    }
                })], 1)]), s("div", {
                    directives: [{
                        name: "show",
                        rawName: "v-show",
                        value: e.conditionsSet.workTime.enabled,
                        expression: "conditionsSet.workTime.enabled"
                    }],
                    staticClass: "col-sm-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("end_of_work")))]), s("date-picker", {
                    attrs: {
                        config: e.dateOptions
                    },
                    model: {
                        value: e.conditionsSet.workTime.to,
                        callback: function(t) {
                            e.$set(e.conditionsSet.workTime, "to", t)
                        },
                        expression: "conditionsSet.workTime.to"
                    }
                })], 1)])]) : e._e(), s("hr"), e.conditionsSet.workTime ? s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 mb-3 ttl"
                }, [e._v(e._s(e.$t("scenario_schedule_time")))]), s("condition-schedule", {
                    attrs: {
                        "start-time": e.conditionsSet.workTime.startTime,
                        "end-time": e.conditionsSet.workTime.endTime,
                        months: e.conditionsSet.workTime.month,
                        "week-days": e.conditionsSet.workTime.week,
                        "month-days": e.conditionsSet.workTime.monthDay
                    },
                    on: {
                        "update:startTime": function(t) {
                            return e.$set(e.conditionsSet.workTime, "startTime", t)
                        },
                        "update:start-time": function(t) {
                            return e.$set(e.conditionsSet.workTime, "startTime", t)
                        },
                        "update:endTime": function(t) {
                            return e.$set(e.conditionsSet.workTime, "endTime", t)
                        },
                        "update:end-time": function(t) {
                            return e.$set(e.conditionsSet.workTime, "endTime", t)
                        },
                        "update:months": function(t) {
                            return e.$set(e.conditionsSet.workTime, "month", t)
                        },
                        "update:weekDays": function(t) {
                            return e.$set(e.conditionsSet.workTime, "week", t)
                        },
                        "update:week-days": function(t) {
                            return e.$set(e.conditionsSet.workTime, "week", t)
                        },
                        "update:monthDays": function(t) {
                            return e.$set(e.conditionsSet.workTime, "monthDay", t)
                        },
                        "update:month-days": function(t) {
                            return e.$set(e.conditionsSet.workTime, "monthDay", t)
                        }
                    }
                })], 1) : e._e(), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 ttl mb-3"
                }, [e._v(e._s(e.$t("list_of_conditions")))]), e._l(e.scenarioConditionTypes, (function(t) {
                    return s("div", {
                        key: t.value,
                        staticClass: "col-12"
                    }, [s("fieldset", {
                        staticClass: "form-group"
                    }, [s("label", [e._v(e._s(e.$t("condition." + t.value)))]), -1 !== e.dishCategoriesArrayValue.indexOf(t.value) ? s("div", [s("custom-multiselect", e._b({
                        attrs: {
                            options: e.allDishCategories
                        },
                        model: {
                            value: e.conditionsValues[t.value],
                            callback: function(s) {
                                e.$set(e.conditionsValues, t.value, s)
                            },
                            expression: "conditionsValues[item.value]"
                        }
                    }, "custom-multiselect", e.multiSelectConfig, !1))], 1) : -1 !== e.dishesArrayValue.indexOf(t.value) ? s("div", [s("custom-multiselect", e._b({
                        attrs: {
                            options: e.allDishes
                        },
                        model: {
                            value: e.conditionsValues[t.value],
                            callback: function(s) {
                                e.$set(e.conditionsValues, t.value, s)
                            },
                            expression: "conditionsValues[item.value]"
                        }
                    }, "custom-multiselect", e.multiSelectConfig, !1))], 1) : "businessPeriod" === t.value ? s("div", [s("custom-multiselect", e._b({
                        attrs: {
                            label: "name",
                            "show-labels": !1,
                            options: e.allPeriods
                        },
                        scopedSlots: e._u([{
                            key: "option",
                            fn: function(t) {
                                return [s("div", [e._v(e._s(t.option.name) + " "), s("span", {
                                    staticClass: "small font-weight-bold"
                                }, [e._v(" (" + e._s(t.option.ident) + ") ")])])]
                            }
                        }], null, !0),
                        model: {
                            value: e.conditionsValues[t.value],
                            callback: function(s) {
                                e.$set(e.conditionsValues, t.value, s)
                            },
                            expression: "conditionsValues[item.value]"
                        }
                    }, "custom-multiselect", e.multiSelectConfig, !1))], 1) : "restCode" === t.value ? s("div", [s("custom-multiselect", e._b({
                        attrs: {
                            label: "name",
                            options: e.allRestaurants
                        },
                        model: {
                            value: e.conditionsValues[t.value],
                            callback: function(s) {
                                e.$set(e.conditionsValues, t.value, s)
                            },
                            expression: "conditionsValues[item.value]"
                        }
                    }, "custom-multiselect", e.multiSelectConfig, !1))], 1) : "payment" === t.value ? s("div", {
                        staticClass: "payment-radio"
                    }, [s("b-form-radio-group", {
                        attrs: {
                            options: e.paymentOptions
                        },
                        model: {
                            value: e.conditionsValues[t.value],
                            callback: function(s) {
                                e.$set(e.conditionsValues, t.value, s)
                            },
                            expression: "conditionsValues[item.value]"
                        }
                    })], 1) : s("div", [s("label", [s("input", {
                        directives: [{
                            name: "model",
                            rawName: "v-model",
                            value: e.conditionsValues[t.value],
                            expression: "conditionsValues[item.value]"
                        }],
                        staticClass: "form-control form-control-sm",
                        domProps: {
                            value: e.conditionsValues[t.value]
                        },
                        on: {
                            input: function(s) {
                                s.target.composing || e.$set(e.conditionsValues, t.value, s.target.value)
                            }
                        }
                    })])])])])
                }))], 2), s("hr"), s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-12 text-right"
                }, [s("b-button", {
                    staticClass: "mr-3",
                    attrs: {
                        variant: "success"
                    },
                    on: {
                        click: function(t) {
                            return e.onSave()
                        }
                    }
                }, [e._v(e._s(e.$t("save")))]), s("b-button", {
                    attrs: {
                        variant: "danger"
                    },
                    on: {
                        click: function(t) {
                            return e.goBack()
                        }
                    }
                }, [e._v(" " + e._s(e.$t("cancel")) + " ")])], 1)])])])
            },
            Co = [],
            ko = function() {
                var e = this,
                    t = e.$createElement,
                    s = e._self._c || t;
                return s("div", {
                    staticClass: "condition-schedule container"
                }, [s("div", {
                    staticClass: "row"
                }, [s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("condition.condition_start_time")))]), s("b-form-timepicker", {
                    attrs: {
                        placeholder: e.$t("choose"),
                        "no-close-button": !0,
                        "hide-header": !0,
                        hour12: !1,
                        "reset-button": !0,
                        "reset-button-variant": "outline-secondary",
                        "label-reset-button": e.$t("reset")
                    },
                    model: {
                        value: e.startTimeSel,
                        callback: function(t) {
                            e.startTimeSel = t
                        },
                        expression: "startTimeSel"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-6"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("condition.condition_end_time")))]), s("b-form-timepicker", {
                    attrs: {
                        state: e.isEndTimeValid,
                        placeholder: e.$t("choose"),
                        "no-close-button": !0,
                        "hide-header": !0,
                        hour12: !1,
                        "reset-button": !0,
                        "reset-button-variant": "outline-secondary",
                        "label-reset-button": e.$t("reset")
                    },
                    model: {
                        value: e.endTimeSel,
                        callback: function(t) {
                            e.endTimeSel = t
                        },
                        expression: "endTimeSel"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("condition.condition_months")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.monthsOptions,
                        "track-by": "value",
                        label: "label",
                        searchable: !0,
                        multiple: !0,
                        "close-on-select": !1,
                        "clear-on-select": !0,
                        placeholder: e.$t("choose"),
                        selectedLabel: e.$t("selected"),
                        selectLabel: e.$t("add"),
                        deselectLabel: e.$t("delete")
                    },
                    model: {
                        value: e.monthsSel,
                        callback: function(t) {
                            e.monthsSel = t
                        },
                        expression: "monthsSel"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("condition.condition_week_days")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.weekDaysOptions,
                        "track-by": "value",
                        label: "label",
                        searchable: !0,
                        multiple: !0,
                        "close-on-select": !1,
                        "clear-on-select": !0,
                        placeholder: e.$t("choose"),
                        selectedLabel: e.$t("selected"),
                        selectLabel: e.$t("add"),
                        deselectLabel: e.$t("delete")
                    },
                    model: {
                        value: e.weekDaysSel,
                        callback: function(t) {
                            e.weekDaysSel = t
                        },
                        expression: "weekDaysSel"
                    }
                })], 1)]), s("div", {
                    staticClass: "col-12"
                }, [s("fieldset", {
                    staticClass: "form-group"
                }, [s("label", [e._v(e._s(e.$t("condition.condition_month_days")))]), s("custom-multiselect", {
                    attrs: {
                        options: e.monthDaysOptions,
                        "track-by": "value",
                        label: "label",
                        searchable: !0,
                        multiple: !0,
                        "close-on-select": !1,
                        "clear-on-select": !0,
                        placeholder: e.$t("choose"),
                        selectedLabel: e.$t("selected"),
                        selectLabel: e.$t("add"),
                        deselectLabel: e.$t("delete")
                    },
                    model: {
                        value: e.monthDaysSel,
                        callback: function(t) {
                            e.monthDaysSel = t
                        },
                        expression: "monthDaysSel"
                    }
                })], 1)])])])
            },
            So = [],
            $o = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            Ro = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            jo = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
            To = {
                name: "ConditionSchedule",
                components: {
                    CustomMultiselect: er
                },
                created: function() {
                    var e = this;
                    this.startTimeSel = this.startTime, this.endTimeSel = this.endTime, W.a.each(this.months, (function(t) {
                        var s = W.a.find(e.monthsOptions, (function(e) {
                            return e.value === t
                        }));
                        s && e.monthsSel.push(s)
                    })), W.a.each(this.weekDays, (function(t) {
                        var s = W.a.find(e.weekDaysOptions, (function(e) {
                            return e.value === t
                        }));
                        s && e.weekDaysSel.push(s)
                    })), W.a.each(this.monthDays, (function(t) {
                        var s = W.a.find(e.monthDaysOptions, (function(e) {
                            return e.value === t
                        }));
                        s && e.monthDaysSel.push(s)
                    }))
                },
                props: {
                    startTime: {
                        type: String,
                        default: ""
                    },
                    endTime: {
                        type: String,
                        default: ""
                    },
                    months: {
                        type: Array,
                        default: function() {
                            return []
                        }
                    },
                    weekDays: {
                        type: Array,
                        default: function() {
                            return []
                        }
                    },
                    monthDays: {
                        type: Array,
                        default: function() {
                            return []
                        }
                    }
                },
                data: function() {
                    return {
                        startTimeSel: "",
                        endTimeSel: "",
                        monthsSel: [],
                        weekDaysSel: [],
                        monthDaysSel: [],
                        weekDaysRef: $o,
                        monthDaysRef: jo,
                        monthsRef: W.a.map(Ro, (function(e, t) {
                            return {
                                name: e,
                                num: ++t
                            }
                        }))
                    }
                },
                methods: {
                    minutesOfDay: function(e) {
                        var t = mo()(e, "hh:mm:ss");
                        return t.minutes() + 60 * t.hours()
                    }
                },
                computed: {
                    monthsOptions: function() {
                        var e = this;
                        return W.a.map(this.monthsRef, (function(t) {
                            return {
                                value: t.num,
                                label: e.$t("calendar.months.".concat(t.name.toLowerCase()))
                            }
                        }))
                    },
                    weekDaysOptions: function() {
                        var e = this;
                        return W.a.map(this.weekDaysRef, (function(t) {
                            return {
                                value: t,
                                label: e.$t("calendar.days.".concat(t.toLowerCase()))
                            }
                        }))
                    },
                    monthDaysOptions: function() {
                        return W.a.map(this.monthDaysRef, (function(e) {
                            return {
                                value: e,
                                label: e
                            }
                        }))
                    },
                    isEndTimeValid: function() {
                        return !(!W.a.isEmpty(this.startTime) && !W.a.isEmpty(this.endTime) && this.minutesOfDay(this.endTime) < this.minutesOfDay(this.startTime)) && null
                    }
                },
                watch: {
                    startTimeSel: function(e) {
                        this.$emit("update:startTime", e)
                    },
                    endTimeSel: function(e) {
                        this.$emit("update:endTime", e)
                    },
                    monthsSel: function(e) {
                        this.$emit("update:months", W.a.map(e, (function(e) {
                            return e.value
                        })))
                    },
                    weekDaysSel: function(e) {
                        this.$emit("update:weekDays", W.a.map(e, (function(e) {
                            return e.value
                        })))
                    },
                    monthDaysSel: function(e) {
                        this.$emit("update:monthDays", W.a.map(e, (function(e) {
                            return e.value
                        })))
                    }
                }
            },
            Oo = To,
            Po = (s("3ea4"), Object(I["a"])(Oo, ko, So, !1, null, null, null)),
            No = Po.exports,
            Lo = {
                name: "ConditionEdit",
                components: {
                    CustomMultiselect: er,
                    VueMultiselect: Zs["a"],
                    datePicker: lo.a,
                    ConditionSchedule: No
                },
                data: function() {
                    return {
                        workTime: {
                            enabled: !1,
                            from: null,
                            to: null
                        },
                        radioBoolOptions: [{
                            text: this.$t("on"),
                            value: !0
                        }, {
                            text: this.$t("off"),
                            value: !1
                        }],
                        dateOptions: {
                            format: "DD.MM.YYYY HH:mm",
                            useCurrent: !1,
                            showClear: !0,
                            showClose: !0,
                            showTodayButton: !0,
                            locale: "ru",
                            timeZone: "Europe/Moscow",
                            icons: {
                                time: "mdi mdi-clock",
                                date: "mdi mdi-calendar",
                                up: "mdi mdi-chevron-up",
                                down: "mdi mdi-chevron-down",
                                previous: "mdi mdi-arrow-left-drop-circle-outline",
                                next: "mdi mdi-arrow-right-drop-circle-outline",
                                today: "mdi mdi-calendar-check",
                                clear: "mdi mdi-delete",
                                close: "mdi mdi-close"
                            }
                        },
                        modeName: "",
                        conditionsSet: {
                            name: "",
                            conditions: []
                        },
                        conditionsValues: {},
                        scenesValue: {},
                        selectedScene: [],
                        blocks: [],
                        scenes: [],
                        scenarioConditionTypes: re(),
                        selected: [],
                        allDishes: J(),
                        allDishCategories: ee(),
                        allPeriods: te(),
                        allRestaurants: se(),
                        paymentOptions: [{
                            text: this.$t("condition.payment_made"),
                            value: "payment_made"
                        }, {
                            text: this.$t("condition.payment_not_paid"),
                            value: "payment_not_paid"
                        }, {
                            text: this.$t("condition.anyway"),
                            value: "anyway"
                        }],
                        dishCategoriesArrayValue: ["with", "without", "last"],
                        dishesArrayValue: ["withCodes", "withoutCodes", "lastCode"],
                        multiSelectConfig: {
                            placeholder: this.$t("choose_values"),
                            selectedLabel: this.$t("selected"),
                            selectLabel: this.$t("add"),
                            deselectLabel: this.$t("delete"),
                            multiple: !0,
                            closeOnSelect: !1,
                            clearOnSelect: !1,
                            searchable: !0,
                            optionsLimit: 50,
                            label: "text",
                            trackBy: "code"
                        }
                    }
                },
                mounted: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    return t.next = 2, ie();
                                case 2:
                                    e.allDishes = J(), e.allDishCategories = ee(), e.allPeriods = te(), e.allRestaurants = se();
                                case 6:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                created: function() {
                    var e = this;
                    return Object(o["a"])(regeneratorRuntime.mark((function t() {
                        return regeneratorRuntime.wrap((function(t) {
                            while (1) switch (t.prev = t.next) {
                                case 0:
                                    if (e.$store.commit("setPageTitle", e.$t("editor_conditions")), "new" === e.$route.params.guid) {
                                        t.next = 6;
                                        break
                                    }
                                    return t.next = 4, e.get(e.$route.params.guid);
                                case 4:
                                    t.next = 8;
                                    break;
                                case 6:
                                    return t.next = 8, e.generateValues();
                                case 8:
                                case "end":
                                    return t.stop()
                            }
                        }), t)
                    })))()
                },
                methods: {
                    changeScene: function(e) {
                        this.scenesValue[e] = this.selectedScene[e].guid
                    },
                    get: function(e) {
                        var t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        Ys.get(e).then((function(e) {
                                            t.conditionsSet = e, t.generateValues()
                                        }));
                                    case 1:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    set: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            var s;
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return W.a.extend(e.conditionsSet.workTime, {
                                            to: mo()(e.conditionsSet.workTime.to, "DD.MM.YYYY HH:mm").format(),
                                            from: mo()(e.conditionsSet.workTime.from, "DD.MM.YYYY HH:mm").format(),
                                            enabled: e.conditionsSet.workTime.enabled
                                        }), t.next = 3, Ys.set(e.conditionsSet);
                                    case 3:
                                        if (s = t.sent, s.error) {
                                            t.next = 8;
                                            break
                                        }
                                        return t.abrupt("return", !0);
                                    case 8:
                                        return e.$msg.error(s, e), t.abrupt("return", !1);
                                    case 10:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    generateValues: function() {
                        var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                            return regeneratorRuntime.wrap((function(e) {
                                while (1) switch (e.prev = e.next) {
                                    case 0:
                                        return e.next = 2, this.getScenes();
                                    case 2:
                                        return e.next = 4, this.getConditionsValues();
                                    case 4:
                                        return e.next = 6, this.getBlocks();
                                    case 6:
                                    case "end":
                                        return e.stop()
                                }
                            }), e, this)
                        })));

                        function t() {
                            return e.apply(this, arguments)
                        }
                        return t
                    }(),
                    getConditionsValues: function() {
                        var e = this,
                            t = {};
                        this.scenarioConditionTypes.forEach((function(s) {
                            var r = {};
                            e.conditionsSet.conditions && (r = e.conditionsSet.conditions.find((function(e) {
                                return e.type === s.value
                            }))), -1 !== e.dishCategoriesArrayValue.indexOf(s.value) || -1 !== e.dishesArrayValue.indexOf(s.value) ? t[s.value] = r && r.raw ? oe(r.raw) : null : t[s.value] = r && r.raw ? r.raw : null
                        })), this.conditionsSet.workTime ? W.a.extend(this.conditionsSet.workTime, {
                            to: mo()(this.conditionsSet.workTime.to).format("DD.MM.YYYY HH:mm"),
                            from: mo()(this.conditionsSet.workTime.from).format("DD.MM.YYYY HH:mm"),
                            enabled: this.conditionsSet.workTime.enabled
                        }) : this.conditionsSet.workTime = {
                            to: mo()().format("DD.MM.YYYY HH:mm"),
                            from: mo()().format("DD.MM.YYYY HH:mm"),
                            enabled: !1
                        }, t.payment || (t.payment = "anyway"), this.conditionsValues = t
                    },
                    getConditionsScenesValues: function() {
                        var e = this;
                        this.blocks.forEach((function(t) {
                            var s = e.conditionsSet.scenes ? e.conditionsSet.scenes.find((function(e) {
                                return t.id === e.blockGuid
                            })) : {};
                            if (e.scenesValue[t.id] = s ? s.sceneGuid : void 0, s) {
                                var r = e.scenes.find((function(e) {
                                    return e.guid === s.sceneGuid
                                }));
                                e.selectedScene[t.id] = r || {
                                    guid: null,
                                    name: null,
                                    type: null
                                }
                            }
                        }))
                    },
                    onSave: function() {
                        var e = Object(o["a"])(regeneratorRuntime.mark((function e() {
                            var t, s, r = this;
                            return regeneratorRuntime.wrap((function(e) {
                                while (1) switch (e.prev = e.next) {
                                    case 0:
                                        if (this.conditionsSet.name) {
                                            e.next = 3;
                                            break
                                        }
                                        return this.$msg.error(this.$t("enter_name_conditions"), this), e.abrupt("return");
                                    case 3:
                                        this.conditionsSet.conditions = [], e.t0 = regeneratorRuntime.keys(this.conditionsValues);
                                    case 5:
                                        if ((e.t1 = e.t0()).done) {
                                            e.next = 12;
                                            break
                                        }
                                        if (t = e.t1.value, Object.prototype.hasOwnProperty.call(this.conditionsValues, t) && this.conditionsValues[t] && (!Array.isArray(this.conditionsValues[t]) || this.conditionsValues[t].length)) {
                                            e.next = 9;
                                            break
                                        }
                                        return e.abrupt("continue", 5);
                                    case 9:
                                        this.conditionsSet.conditions.push({
                                            type: t,
                                            raw: Array.isArray(this.conditionsValues[t]) ? this.conditionsValues[t].map((function(e) {
                                                return e.code
                                            })) : this.conditionsValues[t]
                                        }), e.next = 5;
                                        break;
                                    case 12:
                                        this.conditionsSet.scenes = [], e.t2 = regeneratorRuntime.keys(this.scenesValue);
                                    case 14:
                                        if ((e.t3 = e.t2()).done) {
                                            e.next = 21;
                                            break
                                        }
                                        if (s = e.t3.value, Object.prototype.hasOwnProperty.call(this.scenesValue, s)) {
                                            e.next = 18;
                                            break
                                        }
                                        return e.abrupt("continue", 14);
                                    case 18:
                                        this.conditionsSet.scenes.push({
                                            blockGuid: s,
                                            sceneGuid: this.scenesValue[s]
                                        }), e.next = 14;
                                        break;
                                    case 21:
                                        return this.conditionsSet.scenarioGuid = this.$route.params.scenarioGuid, this.conditionsSet.guid = "new" === this.$route.params.guid ? null : this.$route.params.guid, e.next = 25, this.set();
                                    case 25:
                                        if (!e.sent) {
                                            e.next = 27;
                                            break
                                        }
                                        setTimeout((function() {
                                            r.$router.push({
                                                name: "scenario-edit",
                                                params: {
                                                    guid: r.$route.params.scenarioGuid
                                                }
                                            })
                                        }), 100);
                                    case 27:
                                    case "end":
                                        return e.stop()
                                }
                            }), e, this)
                        })));

                        function t() {
                            return e.apply(this, arguments)
                        }
                        return t
                    }(),
                    getBlocks: function() {
                        var e = arguments,
                            t = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function s() {
                            var r;
                            return regeneratorRuntime.wrap((function(s) {
                                while (1) switch (s.prev = s.next) {
                                    case 0:
                                        return r = e.length > 0 && void 0 !== e[0] ? e[0] : t.$route.params.scenarioGuid, s.next = 3, ir.get(r).then((function(e) {
                                            t.blocks = e.blocks, t.getConditionsScenesValues()
                                        }));
                                    case 3:
                                    case "end":
                                        return s.stop()
                                }
                            }), s)
                        })))()
                    },
                    getScenes: function() {
                        var e = this;
                        return Object(o["a"])(regeneratorRuntime.mark((function t() {
                            return regeneratorRuntime.wrap((function(t) {
                                while (1) switch (t.prev = t.next) {
                                    case 0:
                                        return t.next = 2, yr.getList().then((function(t) {
                                            e.scenes = t
                                        }));
                                    case 2:
                                    case "end":
                                        return t.stop()
                                }
                            }), t)
                        })))()
                    },
                    goBack: function() {
                        this.$router.push({
                            name: "scenario-edit",
                            params: {
                                guid: this.$route.params.scenarioGuid
                            }
                        })
                    }
                }
            },
            Do = Lo,
            Fo = (s("ce8d"), Object(I["a"])(Do, yo, Co, !1, null, null, null)),
            zo = Fo.exports;
        n["default"].use(H["a"]);
        var Mo = new H["a"]({
                routes: [{
                    path: "/",
                    name: "screen",
                    component: ps,
                    meta: {
                        transition: "fade-in-down"
                    }
                }, {
                    path: "/сonfigurator",
                    component: Ps,
                    meta: {
                        transition: "fade-in-down"
                    },
                    children: [{
                        path: "/dashboard",
                        name: "dashboard",
                        component: Ms,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/scenarios",
                        name: "scenarios",
                        component: Us,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/scenario-edit/:guid?",
                        name: "scenario-edit",
                        component: nr,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/modes",
                        name: "modes",
                        component: mr,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/mode-edit/:guid?/:clone?",
                        name: "mode-edit",
                        component: wr,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/scenes",
                        name: "scenes",
                        component: $r,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/scene-edit/:guid?",
                        name: "scene-edit",
                        component: Kn,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/settings",
                        name: "settings",
                        component: Ya,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/votes",
                        name: "votes",
                        component: go,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }, {
                        path: "/condition-edit/:guid/:scenarioGuid",
                        name: "condition-edit",
                        component: zo,
                        meta: {
                            transition: "fade-in-down"
                        }
                    }]
                }, {
                    path: "/auth",
                    name: "auth",
                    component: Ja,
                    meta: {
                        transition: "fade-in-down"
                    }
                }, {
                    path: "/get-license",
                    name: "get-license",
                    component: ao,
                    meta: {
                        transition: "fade-in-down"
                    }
                }, {
                    path: "/404",
                    name: "404",
                    component: xo,
                    meta: {
                        transition: "fade-in-down"
                    }
                }, {
                    path: "*",
                    redirect: "/404",
                    meta: {
                        transition: "fade-in-down"
                    }
                }]
            }),
            Ao = {
                install: function(e, t) {
                    var s = 3e3,
                        r = {
                            warning: function(e, t) {
                                t.$bvToast.toast(e, {
                                    title: i["a"].t("attention"),
                                    autoHideDelay: s,
                                    variant: "warning",
                                    appendToast: !1
                                })
                            },
                            success: function(e, t) {
                                t.$bvToast.toast(e, {
                                    title: i["a"].t("notify.success"),
                                    autoHideDelay: s,
                                    variant: "success",
                                    appendToast: !1
                                })
                            },
                            error: function(e, t) {
                                var r = t.$createElement,
                                    n = "",
                                    a = "";
                                e.desc ? (n = e.desc, a = e.code) : (n = e, a = "");
                                var o = r("div", {}, [r("span", {}, n), r("br", {}, n), r("small", {}, a)]);
                                t.$bvToast.toast([o], {
                                    title: i["a"].t("notify.danger"),
                                    autoHideDelay: s,
                                    variant: "danger",
                                    appendToast: !1
                                })
                            },
                            info: function(e, t) {
                                t.$bvToast.toast(e, {
                                    title: i["a"].t("notify.information"),
                                    autoHideDelay: s,
                                    variant: "info",
                                    appendToast: !1
                                })
                            }
                        };
                    e.msg = e.prototype.$msg = r
                }
            },
            Io = s("5f5b"),
            Eo = s("9955"),
            Bo = s.n(Eo);

        function Ho() {
            return Object(r["a"])(this, void 0, void 0, (function() {
                return Object(r["b"])(this, (function(e) {
                    switch (e.label) {
                        case 0:
                            return [4, ie()];
                        case 1:
                            return e.sent(), [2]
                    }
                }))
            }))
        }

        function Vo() {
            new n["default"]({
                router: Mo,
                store: _e,
                i18n: L,
                render: function(e) {
                    return e(B)
                }
            }).$mount("#app")
        }
        n["default"].use(Io["a"]), n["default"].use(Ao), n["default"].use(Bo.a, {
            name: "custom",
            lodash: W.a
        }), n["default"].config.productionTip = !1, n["default"].config.devtools = !1, Ho().then((function() {
            setTimeout((function() {
                Vo()
            }), 500)
        }))
    },
    ce00: function(e, t, s) {
        "use strict";
        s("928d")
    },
    ce8d: function(e, t, s) {
        "use strict";
        s("0faf")
    },
    d2ef: function(e, t, s) {
        "use strict";
        s("464e")
    },
    d464: function(e, t, s) {},
    dfbb: function(e, t, s) {
        "use strict";
        s("36a0")
    },
    e0b0: function(e, t, s) {
        e.exports = s.p + "img/cat.20b81161.webp"
    },
    e226: function(e, t, s) {
        "use strict";
        s("2870")
    },
    e5fb: function(e, t, s) {
        "use strict";
        s("f998")
    },
    ebf5: function(e, t, s) {},
    ec25: function(e, t, s) {},
    ed87: function(e, t, s) {},
    f143: function(e, t, s) {},
    f2fd: function(e, t, s) {},
    f346: function(e, t, s) {
        "use strict";
        s("4ac8")
    },
    f96a: function(e, t, s) {
        "use strict";
        s("833c")
    },
    f998: function(e, t, s) {},
    fc99: function(e, t, s) {}
});
