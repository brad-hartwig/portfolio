// version 1.1
// 1) add a quantity row under Pricing Option row
// 2) add Total rows under One-Time Cost and Monthly Cost sections
// 3) calculate column totals based on quantity entered. done onblur or Enter

YUI().use('node', 'event', 'panel', 'io-form', 'json-parse', 'json-stringify', 'node-event-simulate', 'overlay', 'widget-anim', 'selector-css3', function (Y) {
YUI.namespace('merchServPrice');

  var waitingToShow = false;
  var tooltip = '';

  YUI.merchServPrice.renderTooltip = function (e) {
    tooltip = new Y.Overlay({
      srcNode: "#tooltip",
      visible: false,
      zIndex: 1000,
      id: 'myJuicyTooltip'
    }).plug(Y.Plugin.WidgetAnim);
    tooltip.anim.get('animHide').set('duration', 0.01);
    tooltip.anim.get('animShow').set('duration', 0.1);
    tooltip.render();
  }

  YUI.merchServPrice.parseJSON = function(e) {
    priceJSON = Y.JSON.parse(Y.one('#ms-json-price').get('value'));
    // Y.log(Y.one('#ms-json-price').get('value'));
    Y.one('.yui-panel-container').setStyle('top', '10px');
    YUI.merchServPrice.kickoff();
    YUI.merchServPrice.renderTooltip();
  }

  var table,
      sectionsArray,
      productsArray,
      // stops header from repeating
      productHeaderLoop = true,
      // stops radio button row from repeating
      pricingModelLoop = true,
      pricingDataLoop = true;

  // set className for width on product header cells based on number of products chosen
  var dataColWidths = {
    2 : 'ms-two-col',
    3 : 'ms-three-col',
    /*interface should expand to 1255px*/
    4 : 'ms-four-col'
  }

  YUI.merchServPrice.kickoff = function (e) {
    table = Y.one('.ms-pricing-table');
    sectionsArray = priceJSON.sections;
    productsArray = priceJSON.products;

    for (var i = 0, j = sectionsArray.length; i < j; i += 1) {
      var sectionTitle                 = sectionsArray[i].title,
          sectionDisabled              = sectionsArray[i].disabled,
          sectionOrder                 = sectionsArray[i].order,
          sectionID                    = sectionsArray[i].id,
          sectionOptional              = sectionsArray[i].optional,
          sectionShowOnlyUserSelection = sectionsArray[i].show_only_user_selection,
          sectionOptions               = sectionsArray[i].options,
          sectionCategories            = sectionsArray[i].categories,
          sectionInputType             = sectionsArray[i].input_type,
          sectionValue                 = sectionsArray[i].value,
          section                      = sectionTitle.toLowerCase(),
          section                      = section.replace(/\s|-/g, '_');

      // create product header at top of table
      if (productHeaderLoop === true){
        var sectionRow = Y.Node.create('<tr></tr>');
        sectionRow.append(Y.Node.create('<th class="ms-blank-header-cell"></th>'));
        for (var c = 0, d = productsArray.length; c < d; c += 1) {
          var prodCell = Y.Node.create('<th class="center ' + dataColWidths[productsArray.length] + '">' + productsArray[c].display_name + '</th>');
          sectionRow.append(prodCell);
        }
        table.append(sectionRow);
        productHeaderLoop = false;
      }

      // create section headers
      if (sectionTitle != 'Pricing Option'){
        var sectionRow = Y.Node.create('<tr class="ms-price-section-row" data-section="' + section + '"><th colspan="10">' + sectionTitle + '<span class="fa fa-caret-down"></span></th></tr>');
        if (sectionOptional === 1){
          if (sectionTitle == 'Pricing Model'){
            sectionRow.one('th').prepend('<span class="fa fa-section-check-square"></span><input type="hidden" class="el"/>');
          }
          else {
            sectionRow.one('th').prepend('<span class="fa fa-section-check-square"></span><input type="hidden" class="el" name="' + sectionID + '" value="1"/>');
          }
        }
        table.append(sectionRow);
      }

      // IF SECTION IS "PRICING MODEL"
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // first row with radio buttons
      if (section === 'pricing_model'){
        var pricingModelRow = Y.Node.create('<tr class="ms-price-cat-choice ms-price-header-row"><td colspan="10"></td></tr>');
        for (var x = 0, y = sectionCategories.length; x < y; x += 1) {
          pricingModelRow.one('td').append('<input type="radio" class="pm-radio" name="' + sectionID + '" id="' + sectionCategories[x].id + '" value="' + sectionCategories[x].id + '" onclick="YUI.merchServPrice.buildPricingModel(\'' + sectionCategories[x].title + '\');"/> <label for="' + sectionCategories[x].id + '" >' + sectionCategories[x].title + '</label>');
        }
        table.append(pricingModelRow);
        // record pre-selected radio (category)
        var prodOptions = productsArray[0].options,
            selectedPricingModel;
        for (radioKey in prodOptions){
          if (radioKey === 'pricing_model'){
            selectedPricingModel = prodOptions[radioKey].value;
          }
        }
        // click pre-selected radio (category)
        Y.all('.pm-radio').each(function(node){
          if (node.get('value') == selectedPricingModel){
            // stop from firing event onload to hide tooltip
            Y.on('click', function(e){e.stopPropagation();}, '.pm-radio');
            node.simulate('click');
          }
        });
      }

      // IF SECTION HAS "OPTIONS"
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      if (!(sectionCategories)){
        for (var a = 0, b = sectionOptions.length; a < b; a += 1) {
          if (sectionOptions[a] != null){
            var optionsTitle                 = sectionOptions[a].title,
                optionsID                    = sectionOptions[a].id,
                optionsDisabled              = sectionOptions[a].disabled,
                optionsOrder                 = sectionOptions[a].order,
                optionsOptional              = sectionOptions[a].optional,
                optionsHelp                  = sectionOptions[a].help_text,
                optionsShowOnlyUserSelection = sectionOptions[a].show_only_user_selection;

            var row = Y.Node.create('<tr class="ms-price-data-row ' + section + '_row"></tr>');

            // first cell in row (product option); display of checkbox
            if (optionsTitle){
              var optionCell = Y.Node.create('<td class="ms-price-option-cell">' + optionsTitle + '</td>');
            }
            if (!(optionsTitle)){
              var optionCell = Y.Node.create('<td class="ms-price-option-cell" data-label="' + sectionTitle + '">' + sectionTitle + '</td>');
            }
            if (optionsOptional === 1){
              optionCell.prepend('<input type="hidden" name="' + optionsID + '" class="el"/><span class="fa fa-option-check-square"></span>');
            }
            if (optionsHelp){
              optionCell.append('<span class="ms-price-help fa fa-question-circle" help="' + optionsHelp + '"></span>');
            }
            if (optionsDisabled && optionsDisabled === 1){
              if (optionCell.one('.fa-option-check-square')){
                optionCell.one('.fa-option-check-square').replaceClass('fa-option-check-square', 'fa-option-square');
              }
              row.addClass('inactive-data-row');
            }
            row.append(optionCell);

            /// CREATE DATA CELLS ///

            // subsequent cells in row (product data)
            // loop through chosen products
            for (var x = 0, y = productsArray.length; x < y; x += 1) {
              var dataCell = Y.Node.create('<td class="ms-price-data-cell"></td>');
              // if "options" object
              if ('options' in productsArray[x]){
                // loop through sections in "options" object
                for (key in productsArray[x].options){
                  // if product section is equal to "Section"
                  if (key == section){
                    var idMatch = false;
                    var productsOptionsKeyObject = productsArray[x].options[key];
                    // does key have any data
                    if (productsOptionsKeyObject.length > 0){
                    // loop through objects in section key
                      for (var s = 0, t = productsOptionsKeyObject.length; s < t; s += 1) {
                        var prodSectionOptions   = productsOptionsKeyObject[s].options,
                            prodSectionOrder     = productsOptionsKeyObject[s].order,
                            prodSectionInputType = productsOptionsKeyObject[s].input_type,
                            prodSectionTitle     = productsOptionsKeyObject[s].title,
                            prodSectionID        = productsOptionsKeyObject[s].id,
                            prodSectionValue     = productsOptionsKeyObject[s].value;

                        // for Pricing Option and Available Offers
                        if (section == 'pricing_option' || section == 'available_offers' || section === 'quantity'){
                          if (productsOptionsKeyObject[s].id.indexOf(sectionID) > -1){
                            // if text populates cell
                            if (prodSectionInputType === 'plain_text'){
                              dataCell.append(prodSectionOptions + '<input type="hidden" class="el" name="' + prodSectionID + '" value="' + prodSectionOptions + '"/>');
                            }
                            // if text and text input populates cell
                            if (prodSectionInputType === 'combo'){
                              dataCell.append(prodSectionOptions + ' @ $ <input type="text" name="' + prodSectionID + '" value="' + prodSectionValue + '" placeholder="XX.XX" class="el ms-price-text-input"/>');
                            }
                            // if integer and text input populates cell e.g. Quantity
                            if (prodSectionInputType === 'integer'){
                              dataCell.append('<input type="text" name="' + prodSectionID + '" value="' + prodSectionValue + '" class="el ms-price-quantity ms-price-quantity-' + x + '" data-column="' + x + '"/>');
                            }
                            idMatch = true;
                          }
                        }
                        // for everything else
                        else if (productsOptionsKeyObject[s].id.indexOf(optionsID) > -1){
                          // if pulldown populates cell
                          if (prodSectionInputType === 'pulldown'){
                            var select = Y.Node.create('<select name="' + prodSectionID + '" class="el ms-price-select"></select>');
                            for (var ii = 0, jj = prodSectionOptions.length; ii < jj; ii += 1) {
                              var option = Y.Node.create('<option value="' + prodSectionOptions[ii] + '">' + prodSectionOptions[ii] + '</option>');
                              // set selected option
                              if (prodSectionOptions[ii] === prodSectionValue){
                                option.setAttribute('selected', 'selected');
                              }
                              select.append(option);
                            }
                            dataCell.append(select);
                          }
                          // if text input dollar populates cell
                          if (prodSectionInputType === 'dollar'){
                            dataCell.addClass('ms-price-dollar');
                            dataCell.append('<input type="text" name="' + prodSectionID + '" value="' + prodSectionValue + '" placeholder="XX.XX" class="el ms-price-max-input ' + section + '-' + x + '" data-section="' + section + '" data-column="' + x + '"/>');
                            if (x === 0){
                              dataCell.one('input').addClass('ms-price-clone');
                            }
                            if (x > 0){
                              dataCell.one('input').addClass('ms-price-clone-target');
                            }
                          }
                          // if text input percentage populates cell
                          if (prodSectionInputType === 'percent'){
                            dataCell.addClass('ms-price-percent');
                            dataCell.append('<input type="text" name="' + prodSectionID + '" value="' + prodSectionValue + '" placeholder="X.XX" class="el ms-price-max-input"/>');
                            if (x === 0){
                              dataCell.one('input').addClass('ms-price-clone');
                            }
                            if (x > 0){
                              dataCell.one('input').addClass('ms-price-clone-target');
                            }
                          }
                          // if this cell should be a total of the rows preceeding it
                          if (prodSectionInputType === 'total'){
                            dataCell.addClass('ms-price-dollar ms-price-total-td');
                            dataCell.append('<input type="text" name="' + prodSectionID + '" value="' + prodSectionValue + '" placeholder="0.00" class="el ms-price-max-input ms-price-total ' + section + '-' + x + '-total" data-section="' + section + '" data-column="' + x + '" readonly/>');
                          }
                          // if text populates cell
                          if (prodSectionInputType === 'plain_text'){
                            dataCell.append(prodSectionOptions + '<input type="hidden" class="el" name="' + prodSectionID + '" value="' + prodSectionOptions + '"/>');
                          }
                          // if text and text input populates cell
                          if (prodSectionInputType === 'combo'){
                            dataCell.append(prodSectionOptions + ' @ $ <input type="text" name="' + prodSectionID + '" value="' + prodSectionValue + '" placeholder="XX.XX" class="el ms-price-text-input"/>');
                          }
                          // if text and text input populates cell & '/ month' is needed
                          if (prodSectionInputType === 'combo' && prodSectionOptions != 'Purchase'){
                            dataCell.append('&nbsp;/&nbsp;month');
                          }
                          idMatch = true;
                        }
                      }
                    }
                  }
                }
              }
              // sectionID or optionsID could not be found
              if (idMatch === false){
                dataCell.append('N/A');
              }
              row.append(dataCell);
            }
            if (section === 'pricing_option'){
              table.one('tr').insert(row, 'after');
            }
            else{
              table.append(row);
            }
          }
        }
      }
      // disable section on panel load if set to disabled in json
      if (sectionDisabled && sectionDisabled === 1){
        var sectionHeader = Y.one('.' + section + '_row').previous('.ms-price-section-row');
        sectionHeader.one('.fa-section-check-square').replaceClass('fa-section-check-square', 'fa-section-square');
        sectionHeader.one('input.el').setAttribute('disabled', 'disabled');
        Y.all('.' + section + '_row').addClass('inactive-data-row');
        Y.all('.' + section + '_row td .el').each(function(node){
          node.setAttribute('disabled', 'disabled');
        });
        Y.all('.' + section + '_row td .fa-option-check-square').each(function(node){
          node.replaceClass('fa-option-check-square', 'fa-option-square');
        });
        if (section == 'pricing_model'){
          Y.one('.ms-price-cat-choice').addClass('inactive-data-row');
          Y.all('.ms-price-cat-choice input').setAttribute('disabled', 'disabled');
        }
      }
    }
    productHeaderLoop = true;
    // disable row(s) on panel load if set to disabled in json
    Y.all('tr.inactive-data-row td .el').setAttribute('disabled', 'disabled');

    // button to copy input values from first column to other columns
    var cloneRow = Y.Node.create('<tr class="ms-price-clone-row"></tr>');
    cloneRow.append(Y.Node.create('<td></td>'));
    cloneRow.append(Y.Node.create('<td colspan="10" class="ms-price-clone-cell"><button>Copy Values Across Columns<span class="fa fa-chevron-right"></span></button></td>'));
    table.append(cloneRow);

    // create quantity row
    // var quantityRow = Y.Node.create('<tr class="quantity_row"></tr>');
    // var quantityOptionCell = Y.Node.create('<td class="ms-price-option-cell">Quantity</td>');
    // quantityRow.append(quantityOptionCell);
    // for (var b = 0, h = productsArray.length; b < h; b += 1) {
    //   var quantityCell = Y.Node.create('<td class="ms-price-quantity-cell"><input type="text" name="" value="1" class="el ms-price-quantity ms-price-quantity-' + b + '" data-section="' + section + '" data-column="' + b + '"/></td>');
    //   quantityRow.append(quantityCell);
    // }
    // Y.one('.pricing_option_row').insert(quantityRow, 'after');

    Y.on('click', YUI.merchServPrice.enableDisableRow, 'tr:not(.pricing_model_row) .fa-option-check-square, tr:not(.pricing_model_row) .fa-option-square');
    Y.on('click', YUI.merchServPrice.enableDisableSection, '.fa-section-check-square, .fa-section-square');
  }

  YUI.merchServPrice.buildPricingModel = function (selected) {
    for (var i = 0, j = sectionsArray.length; i < j; i += 1) {
      for (var sectionKey in sectionsArray[i]){
        var sectionOrder      = sectionsArray[i].order,
            sectionCategories = sectionsArray[i].categories,
            sectionOptional   = sectionsArray[i].optional,
            sectionTitle      = sectionsArray[i].title,
            sectionID         = sectionsArray[i].id,
            section           = sectionTitle.toLowerCase(),
            section           = section.replace(/\s|-/g, '_');

        if (section === 'pricing_model'){
          // categories array
          for (var a = 0, b = sectionCategories.length; a < b; a += 1) {
            var categoriesOptions = sectionCategories[a].options,
                categoriesID = sectionCategories[a].id,
                categoriesTitle = sectionCategories[a].title;
            if (categoriesTitle === selected){
              Y.all('.pricing_model_row').remove();
              for (var x = 0, y = categoriesOptions.length; x < y; x += 1) {
                var optionsTitle                 = categoriesOptions[x].title,
                    optionsID                    = categoriesOptions[x].id,
                    optionsDisabled              = categoriesOptions[x].disabled,
                    optionsOrder                 = categoriesOptions[x].order,
                    optionsOptional              = categoriesOptions[x].optional,
                    optionsHelp                  = categoriesOptions[x].help_text,
                    optionsShowOnlyUserSelection = categoriesOptions[x].show_only_user_selection,
                    row = Y.Node.create('<tr class="ms-price-data-row pricing_model_row"></tr>');

                // first cell in row (product option); display of checkbox
                var optionCell = Y.Node.create('<td class="ms-price-option-cell">' + optionsTitle + '</td>');
                if (optionsOptional === 1){
                  optionCell.prepend('<input type="hidden" name="' + optionsID + '" class="el"/><span class="fa fa-option-check-square"></span>');
                }
                if (optionsHelp){
                  optionCell.append('<span class="ms-price-help fa fa-question-circle" help="' + optionsHelp + '"></span>');
                }
                if (optionsDisabled && optionsDisabled === 1){
                  if (optionCell.one('.fa-option-check-square')){
                    optionCell.one('.fa-option-check-square').replaceClass('fa-option-check-square', 'fa-option-square');
                  }
                  row.addClass('inactive-data-row');
                }
                row.append(optionCell);

                /// CREATE DATA CELLS ///

                // subsequent cells in row (product data)
                for (var r = 0, s = productsArray.length; r < s; r += 1) {
                  var prodOptions = productsArray[r].options;
                  for (sectionKey in prodOptions){
                    if (sectionKey === section){
                      for (catsKey in prodOptions[sectionKey]) {
                        for (var rr = 0, ss = prodOptions[sectionKey][catsKey].length; rr < ss; rr += 1) {
                          var prodCatOptions = prodOptions[sectionKey][catsKey][rr].options;
                          for (optionsKey in prodOptions[sectionKey][catsKey][rr]){
                            // if this category matches chosen radio button
                            if (optionsKey === 'id' && prodOptions[sectionKey][catsKey][rr][optionsKey].indexOf(categoriesID) > -1){
                              for (var rrr = 0, sss = prodCatOptions.length; rrr < sss; rrr += 1) {
                                var prodCatOptionsTitle = prodCatOptions[rrr].title,
                                    prodCatOptionsValue = prodCatOptions[rrr].value,
                                    prodCatOptionsInputType = prodCatOptions[rrr].input_type,
                                    prodCatOptionsID = prodCatOptions[rrr].id;
                                if (prodCatOptionsTitle === optionsTitle){
                                  var dataCell = Y.Node.create('<td class="ms-price-data-cell"><input type="text" name="' + prodCatOptionsID + '" value="' + prodCatOptionsValue + '" placeholder="X.XX" class="el ms-price-max-input"/></td>');
                                  if (prodCatOptionsInputType === 'dollar'){
                                    dataCell.addClass('ms-price-dollar');
                                  }
                                  if (prodCatOptionsInputType === 'percent'){
                                    dataCell.addClass('ms-price-percent');
                                  }
                                  if (r === 0){
                                    dataCell.one('input').addClass('ms-price-clone');
                                  }
                                  if (r > 0){
                                    dataCell.one('input').addClass('ms-price-clone-target');
                                  }
                                  row.append(dataCell);
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                table.one('.ms-price-cat-choice').insert(row, 'after');
              }
            }
          }
        }
      }
    }
    Y.on('click', YUI.merchServPrice.enableDisableRow, 'tr.pricing_model_row .fa-option-check-square, tr.pricing_model_row .fa-option-square');
  }

  YUI.merchServPrice.enableDisableSection = function (e) {
    e.stopPropagation();
    var row = this.ancestor('tr'),
        section = row.getData('section');
    if (this.hasClass('fa-section-check-square')){
      this.replaceClass('fa-section-check-square', 'fa-section-square');
      Y.all('.' + section + '_row').addClass('inactive-data-row');
      Y.all('.' + section + '_row td .el').each(function(node){
        node.setAttribute('disabled', 'disabled');
      });
      this.next('input.el').setAttribute('disabled', 'disabled');
      Y.all('.' + section + '_row td .fa-option-check-square').each(function(node){
        node.replaceClass('fa-option-check-square', 'fa-option-square');
      });
      if (section == 'pricing_model'){
        Y.one('.ms-price-cat-choice').addClass('inactive-data-row');
        Y.all('.ms-price-cat-choice input').setAttribute('disabled', 'disabled');
      }
    }
    else if (this.hasClass('fa-section-square')){
      this.replaceClass('fa-section-square', 'fa-section-check-square');
      Y.all('.' + section + '_row').removeClass('inactive-data-row');
      Y.all('.' + section + '_row td .el').each(function(node){
        node.removeAttribute('disabled');
      });
      this.next('input.el').removeAttribute('disabled', 'disabled');
      Y.all('.' + section + '_row td .fa-option-square').each(function(node){
        node.replaceClass('fa-option-square', 'fa-option-check-square');
      });
      if (section == 'pricing_model'){
        Y.one('.ms-price-cat-choice').removeClass('inactive-data-row');
        Y.all('.ms-price-cat-choice input').removeAttribute('disabled');
      }
    }
  }

  YUI.merchServPrice.enableDisableRow = function (e) {
    var row = this.ancestor('tr');
    if (this.hasClass('fa-option-check-square')){
      this.replaceClass('fa-option-check-square', 'fa-option-square');
      row.addClass('inactive-data-row');
      row.all('td .el').each(function(node){
        node.setAttribute('disabled', 'disabled');
      });
    }
    else if (this.hasClass('fa-option-square')){
      this.replaceClass('fa-option-square', 'fa-option-check-square');
      row.removeClass('inactive-data-row');
      row.all('td .el').each(function(node){
        node.removeAttribute('disabled');
      });
    }
  }

  YUI.merchServPrice.showHideSection = function (e) {
    var section = this.getData('section');
    if (this.hasClass('inactive-section')){
      Y.all('.' + section + '_row').removeClass('hide');
      this.removeClass('inactive-section');
      this.one('.fa-caret-right').replaceClass('fa-caret-right', 'fa-caret-down');
      if (this.next('tr').hasClass('ms-price-header-row')){
        this.next('tr').removeClass('hide');
      }
    }
    else{
      Y.all('.' + section + '_row').addClass('hide');
      this.addClass('inactive-section');
      this.one('.fa-caret-down').replaceClass('fa-caret-down', 'fa-caret-right');
      if (this.next('tr').hasClass('ms-price-header-row')){
        this.next('tr').addClass('hide');
      }
    }
  }

  // copy values in text inputs across columns
  YUI.merchServPrice.copyValues = function (e) {
    e.preventDefault();
    table.all('.ms-price-clone').each(function(node){
      var slice = node.get('name').slice(-2);
      if (slice === '_0'){
        var paren = node.ancestor('tr');
        paren.all('.ms-price-clone-target').each(function(target){
          target.set('value', node.get('value'));
        });
      }
    });
    YUI.merchServPrice.calculateTotals();
  }

  YUI.merchServPrice.validateTEMP = function (e) {
    e.preventDefault();
    var asn = this.getData('asn');
    Y.one('#ms-pricing-func').set('value', 'process_step');
    mepa(asn,'submit');
  }

  YUI.merchServPrice.validate = function (e) {
    e.preventDefault();
    var asn = this.getData('asn');
    Y.one('.ms-pricing-warning').addClass('hide');
    Y.all('td.ms-price-error').removeClass('ms-price-error');
    var error = false,
        pmRadioChecked = false;
    // fill in all text inputs
    table.all('input[type=text]').each(function(node){
      if (!node.hasAttribute('disabled') && !node.get('value')){
        node.ancestor('td').addClass('ms-price-error');
        error = true;
      }
    });
    // check a radio button in Pricing Model
    Y.all('.pm-radio').each(function(node){
      if (Y.Node.getDOMNode(node).checked){
        pmRadioChecked = true;
      }
    });
    if (pmRadioChecked === false){
      Y.one('.ms-price-header-row td').addClass('ms-price-error');
    }
    if (error === true || pmRadioChecked === false){
      Y.one('.ms-pricing-warning').removeClass('hide');
    }
    else{
      Y.one('#ms-pricing-func').set('value', 'process_step');
      // Y.one('#ms-pricing-func').set('value', 'process_pricing_matrix_pricing');
      mepa(asn,'submit');
    }
    window.scrollTo(0, 0);
  }

  YUI.merchServPrice.tabReplaceEnter = function (e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      var nextTR = this.ancestor('tr').next('tr.ms-price-data-row');
      if (nextTR){
        nextTR.one('td.ms-price-data-cell input').focus();
      }
    }
  }

  YUI.merchServPrice.numDecimal = function (e) {
    this.set('value', this.get('value').replace(/[^.0-9]/g,''));
  }

  YUI.merchServPrice.wholeNum = function (e) {
    this.set('value', this.get('value').replace(/[^0-9]/g,''));
  }

  YUI.merchServPrice.saveOverlay = function (e) {
    Y.one('.ms-price-body-save').setAttribute('disabled', 'disabled');
    // rendering an id creates a nested overlay
    var priceSaveOverlay = new Y.Overlay({
      bodyContent : 'Give your pricing matrix a name before saving.<br/><br/><input type="text" class="ms-price-overlay-save-name"/><br/><br/><a href="#" class="ms-price-overlay-save"><img src="/images/save_blue.gif"/></a>&nbsp;&nbsp;&nbsp;<a href="#" class="ms-price-overlay-cancel"><img src="/images/cancel_blue.png"/></a>&nbsp;&nbsp;&nbsp;<img class="ms-price-loader hide" src="/images/loader_18.gif"/><div class="ms-save-error"></div>',
      width       : 400,
      zIndex      : 1020,
      centered    : true,
      render      : '#ms-price-save-content',
      id          : 'priceSaveOverlay'
    });
    Y.one('.ms-price-overlay-save-name').focus();
  }

  YUI.merchServPrice.enterSave = function (e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      YUI.merchServPrice.save(e);
    }
  }

  YUI.merchServPrice.save = function (e) {
    e.preventDefault();
    if (!Y.one('.ms-price-overlay-save-name').get('value')){
      Y.one('.ms-save-error').set('innerHTML', '<br/>Please enter a name before saving.');
    }
    else{
      var asn = Y.one('#ms-pricing-asn').get('value');
      Y.one('#ms-pricing-func').set('value', 'save_pricing_matrix');
      Y.one('#ms-pricing-save-name').set('value', Y.one('.ms-price-overlay-save-name').get('value'));
      Y.one('.ms-price-loader').removeClass('hide');
      var uri = '/auth/adcreator';
      var cfg = {
        method: 'POST',
        form: {
          id: 'form_' + asn,
          upload: false
        },
        on: {
          complete: function(){
            priceSaveOverlay.remove();
            Y.one('.ms-price-body-save').removeAttribute('disabled');
          },
          failure: function(){
            Y.one('.ms-price-loader').addClass('hide');
            Y.one('.ms-save-error').set('innerHTML', '<br/>An error occurred while saving. Please try again.');
          }
        }
      };
      Y.io(uri, cfg);
    }
  }

  YUI.merchServPrice.cancel = function (e) {
    e.preventDefault();
    priceSaveOverlay.remove();
    Y.one('.ms-price-body-save').removeAttribute('disabled');
  }

  // handler that positions and shows the notes tooltip
  var showTip = function (e) {
    var i;
    if (tooltip.get('visible') === false) {
      // while it's still hidden, move the tooltip adjacent to the cursor
      Y.one('#tooltip').setStyle('opacity', '0');
      tooltip.align(e.currentTarget, [Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.TR]);
    }
    if (waitingToShow === false) {
      // wait half a second, then show tooltip
      // setTimeout(function(){
        Y.one('#tooltip').setStyle('opacity', '1');
        tooltip.show();
      // }, 50);

      // while waiting to show tooltip, don't let other
      // mousemoves try to show tooltip too.
      waitingToShow = true;

      // replace special characters
      // var helpText = this.getAttribute('help').replace(/\s|-/g, '_');
      // tooltip.setStdModContent('body', helpText);
      tooltip.setStdModContent('body', this.getAttribute('help'));
    }
  }

  // handler that hides the tooltip
  var hideTip = function (e) {
    // this check prevents hiding the tooltip
    // when the cursor moves over the tooltip itself
    if ((e.relatedTarget) && (e.relatedTarget.hasClass('yui3-widget-bd') === false)) {
      tooltip.hide();
      waitingToShow = false;
    }
  }

  // WAS CAUSING PROBLEMS WHEN OPENING A SAVED MATRIX;
  // A SIMULATED CLICK WAS CAUSING AN ERROR
  // handler that hides the tooltip
  var clickHideTip = function (e) {
    tooltip.hide();
    waitingToShow = false;
  }

  YUI.merchServPrice.calculateTotals = function(e){
    var columnCount       = productsArray.length,
        sectionWithTotal = ['one_time_cost', 'monthly_cost'],
        n                 = 0;
    while (n < columnCount){
      for (var i = 0, j = sectionWithTotal.length; i < j; i++){
        var sectionTotal    = Y.one('.' + sectionWithTotal[i] + '-' + n + '-total'),
            sectionTotalVal = 0;
        if (sectionTotal){
          // loop pricing inputs
          Y.all('.' + sectionWithTotal[i] + '-' + n).each(function(node){
            if (node.get('value')){
              // add all pricing inputs in a single section
              sectionTotalVal = sectionTotalVal + parseFloat(node.get('value'));
            }
          });
          // the sum of all pricing inputs multiplied by quantity
          sectionTotalVal = sectionTotalVal * Y.one('.ms-price-quantity-' + n).get('value');
          // two decimal points and rounded up or down
          sectionTotal.set('value', sectionTotalVal.toFixed(2));
        }
      }
      n++;
    }
  }

  YUI.merchServPrice.handleQuantity = function(e){
    var eventType = e.type,
        column    = this.getData('column');
    if (eventType == 'keyup'){
      if (this.get('value').length > 0){
        YUI.merchServPrice.calculateTotals();
      }
    }
    if (eventType == 'blur'){
      if (this.get('value').length < 1 || this.get('value') == 0){
        this.set('value', 1);
        YUI.merchServPrice.calculateTotals();
      }
    }
  }

  YUI.merchServPrice.merchServPriceInit = function () {
    var priceJSON;
    Y.delegate('keypress', YUI.merchServPrice.tabReplaceEnter, 'body', '.ms-pricing-table input[type=text]');
    Y.delegate('click', YUI.merchServPrice.showHideSection, 'body', '.ms-price-section-row');
    Y.delegate('click', YUI.merchServPrice.copyValues, 'body', '.ms-price-clone-cell button');
    Y.delegate('keyup', YUI.merchServPrice.numDecimal, 'body', '.ms-price-text-input, .ms-price-percent input, .ms-price-dollar input');
    Y.delegate('keyup', YUI.merchServPrice.wholeNum, 'body', '.ms-price-quantity');
    // Y.delegate('click', YUI.merchServPrice.validateTEMP, 'body', '.ms-price-apply');
    Y.delegate('click', YUI.merchServPrice.validate, 'body', '.ms-price-apply');
    Y.delegate('mousemove', showTip, 'body', '.ms-price-help');
    Y.delegate('mouseleave', hideTip, 'body', '.ms-price-help');
    Y.delegate('mouseleave', hideTip, 'body', '#tooltip');
    Y.delegate('click', clickHideTip, 'body', '.ms-pricing-wrapper');
    Y.delegate('click', YUI.merchServPrice.saveOverlay, 'body', '.ms-price-body-save');
    Y.delegate('click', YUI.merchServPrice.save, 'body', '.ms-price-overlay-save');
    Y.delegate('click', YUI.merchServPrice.cancel, 'body', '.ms-price-overlay-cancel');
    Y.delegate('keypress', YUI.merchServPrice.enterSave, 'body', '.ms-price-overlay-save-name');
    Y.delegate('keyup', YUI.merchServPrice.calculateTotals, 'body', '.ms-price-max-input');
    Y.delegate('keyup', YUI.merchServPrice.handleQuantity, 'body', '.ms-price-quantity');
    Y.delegate('blur', YUI.merchServPrice.handleQuantity, 'body', '.ms-price-quantity');
  }
  Y.on("domready", YUI.merchServPrice.merchServPriceInit);
});
