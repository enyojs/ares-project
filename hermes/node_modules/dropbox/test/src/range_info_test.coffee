describe 'Dropbox.RangeInfo', ->
  describe '.parse', ->
    describe 'on the first RFC 2616 example', ->
      beforeEach ->
        @range = Dropbox.RangeInfo.parse 'bytes 0-499/1234'

      it 'parses correctly', ->
        expect(@range).to.have.property 'start'
        expect(@range.start).to.equal 0
        expect(@range).to.have.property 'end'
        expect(@range.end).to.equal 499
        expect(@range).to.have.property 'size'
        expect(@range.size).to.equal 1234

    describe 'on the third RFC 2616 example', ->
      beforeEach ->
        @range = Dropbox.RangeInfo.parse 'bytes 500-1233/1234'

      it 'parses correctly', ->
        expect(@range).to.have.property 'start'
        expect(@range.start).to.equal 500
        expect(@range).to.have.property 'end'
        expect(@range.end).to.equal 1233
        expect(@range).to.have.property 'size'
        expect(@range.size).to.equal 1234

    describe 'on the last RFC 2616 example', ->
      beforeEach ->
        @range = Dropbox.RangeInfo.parse 'bytes 21010-47021/47022'

      it 'parses correctly', ->
        expect(@range).to.have.property 'start'
        expect(@range.start).to.equal 21010
        expect(@range).to.have.property 'end'
        expect(@range.end).to.equal 47021
        expect(@range).to.have.property 'size'
        expect(@range.size).to.equal 47022

    describe 'on an example missing the size', ->
      beforeEach ->
        @range = Dropbox.RangeInfo.parse 'bytes 0-9/*'

      it 'parses correctly', ->
        expect(@range).to.have.property 'start'
        expect(@range.start).to.equal 0
        expect(@range).to.have.property 'end'
        expect(@range.end).to.equal 9
        expect(@range).to.have.property 'size'
        expect(@range.size).to.equal null
