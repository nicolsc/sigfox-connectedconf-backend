(function(){
  $(document).ready(function() {
    GPSDemo.init();
  });
  
  var GPSDemo =  {
    pollInterval: 30*1000,//ms
    chart: undefined,
    chartTarget: undefined,
    chartData: undefined,
    chartOptions: {
      title: 'Movements detected',
      displayMode: 'markers',
      region:'FR'
    },
    init: function(){
      this.chartTarget = document.getElementById('chart');
      this.initChart();
      this.setChartData();
      this.drawChart();
      
      
      this.pollData(this.pollInterval);
      $(window).on('resize', this.drawChart.bind(this));
    },
    /**
    * @function
    * Ask data every {interval} to server
    * Update chart if needed
    **/
    pollData: function(){
      setInterval(function(){
        $.getJSON('/td-gps', function(data){
          if (data && data.length && data.length !== window.entries.length){
            window.entries = data;
            this.setChartData();
            this.drawChart();
          }
        }.bind(this));
      }.bind(this), this.pollInterval);
    },
    initChart: function(target){
      this.chart = new google.visualization.GeoChart(this.chartTarget);
    },
    setChartData: function(){
      var data = new google.visualization.DataTable();
      data.addColumn('number', 'Lat');
      data.addColumn('number', 'Lng');
      //data.addColumn('date', 'Time');

      data.addRows(this.getFormattedData());
      
      this.chartData = data;
    },
    drawChart: function(){
      this.chart.draw(this.chartData, this.chartOptions);
    },
    /*
    * @function
    * return data formatted for Google Charts
    * [ [date, temperature, brightness/20 ]]
    **/
    getFormattedData: function(){
      return entries.map(function(entry){
        return [Number(entry.lat), Number(entry.lng)];
      });
    }
  };
  
})();