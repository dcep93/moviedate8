// https://gist.github.com/denilsonsa/aeb06c662cf98e29c379

// todo allow specifying an offset
function subtitleParseTimestamp(s) {
	//var match = s.match(/^(?:([0-9]{2,}):)?([0-5][0-9]):([0-5][0-9][.,][0-9]{0,3})/);
	// Relaxing the timestamp format:
	var match = s.match(
		/^(?:([0-9]+):)?([0-5][0-9]):([0-5][0-9](?:[.,][0-9]{0,3})?)/
	);
	if (match == null) {
		throw "Invalid timestamp format: " + s;
	}
	var hours = parseInt(match[1] || "0", 10);
	var minutes = parseInt(match[2], 10);
	var seconds = parseFloat(match[3].replace(",", "."));
	return seconds + 60 * minutes + 60 * 60 * hours;
}

function subtitleParser(text) {
	var lines = text
		.trim()
		.replace(/\r+\n/g, "\n")
		.split(/[\r\n]/)
		.map((line) => line.trim());
	// extra line to ensure flushing
	lines.push("\n");
	var cues = [];
	var start = null;
	var end = null;
	var payload = null;
	lines.forEach((line) => {
		if (line.indexOf("-->") >= 0) {
			var splitted = line.split(/[ \t]+-->[ \t]+/);
			if (splitted.length != 2) {
				throw 'Error when splitting "-->": ' + line;
			}

			start = subtitleParseTimestamp(splitted[0]);
			end = subtitleParseTimestamp(splitted[1]);
			payload = [];
		} else if (payload !== null) {
			if (line == "") {
				var text = payload.join("\n");
				var cue = new VTTCue(start, end, text);
				cues.push(cue);
				start = null;
				end = null;
				payload = null;
			} else {
				payload.push(line);
			}
		}
	});

	return cues;
}
