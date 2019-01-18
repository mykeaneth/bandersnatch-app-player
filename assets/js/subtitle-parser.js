function parse_timestamp(s) {
  var match = s.match(/^(?:([0-9]+):)?([0-5][0-9]):([0-5][0-9](?:[.,][0-9]{0,3})?)/);
  if (match == null) {
    throw 'Invalid timestamp format: ' + s;
  }
  var hours = parseInt(match[1] || "0", 10);
  var minutes = parseInt(match[2], 10);
  var seconds = parseFloat(match[3].replace(',', '.'));
  return seconds + 60 * minutes + 60 * 60 * hours;
}

function quick_and_dirty_vtt_or_srt_parser(vtt) {
  var lines = vtt.trim().replace('\r\n', '\n').split(/[\r\n]/).map(function (line) {
    return line.trim();
  });
  var cues = [];
  var start = null;
  var end = null;
  var payload = null;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('-->') >= 0) {
      var splitted = lines[i].split(/[ \t]+-->[ \t]+/);
      if (splitted.length != 2) {
        throw 'Error when splitting "-->": ' + lines[i];
      }

      start = parse_timestamp(splitted[0]);
      end = parse_timestamp(splitted[1]);
    } else if (lines[i] == '') {
      if (start && end) {
        var cue = new VTTCue(start, end, payload);
        cues.push(cue);
        start = null;
        end = null;
        payload = null;
      }
    } else if (start && end) {
      if (payload == null) {
        payload = lines[i];
      } else {
        payload += '\n' + lines[i];
      }
    }
  }
  if (start && end) {
    var cue = new VTTCue(start, end, payload);
    cues.push(cue);
  }

  return cues;
}

function init() {
  var video = document.querySelector('#video');
  var subtitle = document.querySelector('#subtitle');
  var track = video.addTextTrack('subtitles', subtitle.dataset.label, subtitle.dataset.lang);
  track.mode = "showing";
  quick_and_dirty_vtt_or_srt_parser(subtitle.innerHTML).map(function (cue) {
    track.addCue(cue);
  });
}
init();
