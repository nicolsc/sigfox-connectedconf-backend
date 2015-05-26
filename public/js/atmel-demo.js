(function(){
  $(document).ready(function() {
    AtmelDemo.init();
    
    updateNav();
  });
  
  
  function updateNav(){
    $('li a[href="'+window.location.pathname+'"]').parent().addClass('active');
  }
  
  
  var AtmelDemo =  {
    pollInterval: 10*1000,//ms
    chart: undefined,
    chartTarget: undefined,
    chartData: undefined,
    chartOptions: {
      chart: {
        title: 'Temperature & light level evolution',
        subtitle: 'over time'
      }
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
        $.getJSON('/atmel', function(data){
          if (data && data.length && data.length !== window.entries.length){
            window.entries = data;
            this.setChartData();
            this.drawChart();
          }
        }.bind(this));
      }.bind(this), this.pollInterval);
    },
    initChart: function(target){
      this.chart = new google.charts.Line(this.chartTarget);
    },
    setChartData: function(){
      var data = new google.visualization.DataTable();
      data.addColumn('date', 'Time');
      data.addColumn('number', 'Temperature');
      data.addColumn('number', 'Light level / 30');

      data.addRows(this.getFormattedData());
      
      this.chartData = data;
    },
    drawChart: function(){
      this.chart.draw(this.chartData, this.chartOptions);
    },
    /*
    * @function
    * return data formatted for Google Charts
    * [ [date, temperature, brightness/30 ]]
    **/
    getFormattedData: function(){
      return entries.map(function(entry){
        return [new Date(entry.date), entry.temperature, entry.brightness/30];
      });
    }
  };
  
})();