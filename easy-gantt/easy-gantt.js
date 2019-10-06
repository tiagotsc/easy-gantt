$.fn.gantt = function (options) {

    let locale = (options.locale)? options.locale: 'pt-BR';
    moment.locale(locale);
    let dtStart = moment(options.dtStart, "YYYY-MM-DD"); // Define início do calendário
    let dtEnd = moment(options.dtEnd, "YYYY-MM-DD"); // Define fim do calendário
    let countMonth = dtEnd.diff(dtStart, 'month'); // Verifica quantidade de meses entre datas

    let firstDay = '01/'+dtStart.format('MM/YYYY'); // Pega o primeiro dia da data início
    let lastDay = dtEnd.endOf('month').format('DD') +'/'+dtEnd.format("MM/YYYY"); // Pega o último dia da data fim
    let countDays = 1 + moment(lastDay, "DD/MM/YYYY").diff(moment(firstDay, "DD/MM/YYYY"), 'days'); // Verifica a quantidade de dias entre datas
    let tasks = options.data;
    let divGantt = $(this);
	let unic = divGantt.attr('id')+'_'+moment().format('s'); // Cria estancia única para minupular tabela
	let idThead = '#thead_'+unic;
	let idTbody = '#tbody_'+unic;
    //return this.each(function () {
        $(this).css({"margin-left": "auto", "margin-right": "auto", "width": "100%"});
        let table = `<table class="tb-gantt">
                        <thead id="thead_${unic}">
                        </thead>
                        <tbody id="tbody_${unic}">
                        </tbody>
                    </table>`;
        $(this).html(table);

        // Largura default
        let defWidth = divGantt.width() - 50;

        // Se passo largura, define na tabela
        if(!options.width){
            $(idThead+','+idTbody).css('max-width',defWidth+'px');
            // Redimensiona o gráfico de acordo com o redimensionamento da tela
            $(window).resize(function(){
                defWidth = divGantt.width() - 50;
                $(idThead+','+idTbody).css('max-width',defWidth+'px');
            });
        }
        // CSS largura tabela fixa
        if(options.width){
            $(idThead+','+idTbody).css('max-width',options.width+'px');
        }

        // CSS autura tabela
        if(options.height){
            $(idTbody).css('max-height',options.height+'px');
        }

        $(idTbody).scroll(function(e) {
            //detect a scroll event on the tbody
                /*
            Setting the thead left value to the negative valule of tbody.scrollLeft will make it track the movement
            of the tbody element. Setting an elements left value to that of the tbody.scrollLeft left makes it maintain 			it's relative position at the left of the table.
            */
			let scrollLeft = ($(idTbody).scrollLeft() == 0)? -2 : $(idTbody).scrollLeft() - 4;
			scrollLeft = $(idTbody).scrollLeft();
            $(idThead).css("left", -scrollLeft); //fix the thead relative to the body scrolling
            $(idThead+' th:nth-child(1)').css("left", scrollLeft); //fix the first cell of the header
            $(idTbody+' td:nth-child(1)').css("left", scrollLeft); //fix the first column of tdbody
        });

        // Monta o cabeçalho dos meses
        var headerMonthTable = '<th class="bg-space-clear"></th>';
        for(let i = 0; i <= countMonth; i++){
            let month = moment(dtStart, "DD/MM/YYYY").add(i, "month").format('MMMM/YYYY');
            let countDaysMonth = moment(dtStart, "DD/MM/YYYY").add(i, "month").endOf('month').format('DD');
            let classMonth = (i % 2 == 0)? 'month-name-odd': 'month-name-par';
            headerMonthTable += `<th class="${classMonth}" colspan="${countDaysMonth}">${month}</th>`;
        }
        $(idThead).html('<tr>'+headerMonthTable+'</tr>');

        // Monta o cabeçalho dos dias
        var headerDaysTable = '<th class="bg-space-clear"></th>';
        for(let i = 0; i <= countDays-1; i++){
            let day = moment(firstDay, "DD/MM/YYYY").add(i, "days").format('DD');
            let dayNumber = moment(firstDay, "DD/MM/YYYY").add(i, "days").dayOfYear();
            headerDaysTable += `<th class="days" day_number="${dayNumber}">${day}</th>`;
        }
        $(idThead).append('<tr>'+headerDaysTable+'</tr>');

		// Defini largura da primeira coluna do header para se ajustar ao layout e não ficar correndo para o lado
        if(options.widthCorrectionFirstCol){
			$('.bg-space-clear').css('width',options.widthCorrectionFirstCol+'px');
		}

        // Mapeia todos os IDs de dependências
        let deps = $.map(tasks, function(val, i){
            if(val.dep){
                return val.dep.split(',');
            }
        });


        // Distribui as atividades, caso exista
        $.each(tasks, function(index, task) {
            let d1 = moment(task.date_start, "YYYY-MM-DD");
            let d2 = moment(task.date_end, "YYYY-MM-DD");
            let taskName = (task.name)? task.name: '';
            let titleName = (task.title)? task.title: taskName;
            let taskColor = (task.color)? task.color: '#2E8B57';
            let daysCount = d2.diff(d1, 'days') + 1;
            let labelT = (options.labelTask)? taskName: '';

            if(deps.indexOf(task.id.toString()) < 0){ // Pega somentes as atividades ids não não são dependentes
                var tasksTable = '<tr>';
                let classTd = (index % 2 == 0)? 'td-bg1': 'td-bg2';
                for(let i = 0; i <= countDays; i++){
                    //let day = moment(firstDay, "DD/MM/YYYY").add(i, "days").format('DD');
                    let dayNumber = moment(firstDay, "DD/MM/YYYY").add(i, "days").dayOfYear(); // Incrementa o dia
                    if(i == 0){ // Primera interação é o cabeçalho fixo lateral
                        tasksTable += `<td colspan="1" day_number="${dayNumber}"><div></div>${titleName}</td>`;
                    }else{
                        if(d1.dayOfYear()+1 == dayNumber){ // Se número do ano baterem em ambas as datas
                            tasksTable += `<td class="${classTd} td-tasks" task_id="${task.id}" task_name="${taskName}" task_days="${daysCount}" colspan="${daysCount}" day_number="${dayNumber}">
											<div class="div-task" style="background-color: ${taskColor};">${labelT}</div>
											</td>`;
                            i = (i-1) + daysCount; // Atribui a quantidade de dias da atividade ao iterador
                            if(task.dep){ // Se existe atividades de depedência, passa para função que monta dependências
                                let currentDate = moment(firstDay, "DD/MM/YYYY").add(i, "days").format('DD/MM/YYYY');
                                let contentDep = loadDep(tasks, task.dep, i, classTd, currentDate, firstDay);
                                i = contentDep.sequence;
                                tasksTable += contentDep.content;
                            }
                        }else{
                            tasksTable += `<td colspan="1" class="${classTd}" day_number="${dayNumber}"></td>`;
                        }
                    }

                }
                tasksTable += '</tr>';
                $(idTbody).append(tasksTable);
            }

            // Se existe definição de evento click. Atribui ele ao td da atividade
            if(options.click){
                $('.td-tasks').off('click');
                $('.td-tasks').css('cursor','pointer').on('click', function(){
                    options.click($(this).attr('task_id'), $(this).attr('task_name'), $(this).attr('task_days'));
                });
            }

            $('.td-tasks').off('mouseover','**');
            $('.td-tasks').off('mousemove','**');
            $('.td-tasks').off('mouseout','**');
            $('.td-tasks').on('mouseover', function(){ // Cria o tooltip ao passar o mouse na atividade
                let tooltipGantt = `<div class="tooltip-gantt">
                                    <b>${$(this).attr('task_name')}</b><br>
                                    ${$(this).attr('task_days')} dias
                                    </div>`;
                $('body').append(tooltipGantt);
                //$(this).css('z-index', 10000);
                //$('.tooltip-gantt').fadeIn('500');
                //$('.tooltip-gantt').fadeTo('10', 1.9);
            });

            $('.td-tasks').on('mousemove', function(e){ // Arrasta o tooltip de acordo com o mouse
                $('.tooltip-gantt').css('top', e.pageY + 10);
                $('.tooltip-gantt').css('left', e.pageX + 20);
            });

            $('.td-tasks').on('mouseout', function(){ // Remove o tooltip ao tirar o mouse da atividade
                $('.tooltip-gantt').remove();
            });
        });

        /**
         * Faz o carregamento de atividades dependentes caso tenha alguma
         * @param {*} data Json com os dados
         * @param {*} ids Ids das atividades que são dependentes
         * @param {*} sequence Sequência do dia
         * @param {*} classTd Classe de background-color
         * @param {*} currentDate Data corrente da atividade pai
         * @param {*} firstDay Data início do calendário
         */
        function loadDep(data, ids, sequence, classTd, currentDate, firstDay){
            var content = '';
            var newSequence = sequence;
            $.each(ids.split(','), function(index, id) {

                $.map(data, function(val, i){
                    // No mapeamento, se o id do json for igual ao id de alguma dependência e se a data dependência for maior que data corrente. Monta bloco
                    if(val.id == id && moment(val.date_start, "YYYY-MM-DD").isAfter(moment(currentDate, 'DD/MM/YYYY'))){
                        let d1S = moment(val.date_start, "YYYY-MM-DD");
                        let d2S = moment(val.date_end, "YYYY-MM-DD");
                        let taskNameS = (val.name)? val.name: '';
                        let taskColorS = (val.color)? val.color: '#2E8B57';
                        let daysCountS = d2S.diff(d1S, 'days') + 1;
                        let countDays = d2S.diff(moment(currentDate, "DD/MM/YYYY"), 'days');
                        let labelTS = (options.labelTask)? taskNameS: '';

                        // Continua sequência de dias a partir da sequencia corrente e data corrente
                        for(var s = sequence; s <= (countDays+sequence); s++){
                            let dayNumberS = moment(firstDay, "DD/MM/YYYY").add(s, "days").dayOfYear();
                            if(d1S.dayOfYear() == dayNumberS){ // Se número do ano baterem em ambas as datas
                                content += `<td class="${classTd} td-tasks text-center" task_id="${val.id}" task_name="${taskNameS}" task_days="${daysCountS}" colspan="${daysCountS}" day_number="${dayNumberS}">
								<div class="div-task" style="background-color: ${taskColorS};">${labelTS}</div>
								</td>`;
                                s = s + daysCountS;
                                newSequence = s;

                            }else{
                                content += `<td class="${classTd}" day_number="${dayNumberS}"></td>`;
                            }
                        }
                        sequence = newSequence;
                        currentDate = d2S;
                    }
                });

            });
            return {
                sequence: newSequence,
                content: content
            };
        }
    //});
};
