describe 'Dropbox.Util.atob', ->
  it 'decodes an ASCII string', ->
    expect(Dropbox.Util.atob('YTFiMmMz')).to.equal 'a1b2c3'
  it 'decodes a non-ASCII character', ->
    expect(Dropbox.Util.atob('/A==')).to.equal String.fromCharCode(252)

describe 'Dropbox.Util.btoa', ->
  it 'encodes an ASCII string', ->
    expect(Dropbox.Util.btoa('a1b2c3')).to.equal 'YTFiMmMz'
  it 'encodes a non-ASCII character', ->
    expect(Dropbox.Util.btoa(String.fromCharCode(252))).to.equal '/A=='
