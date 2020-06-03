import { Component, OnInit, Output, Input, EventEmitter, AfterViewInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import * as _ from 'lodash-es';
import { count } from 'rxjs/operators';

interface TopicTreeNode {
  id: string;
  name: string;
  selectable: string;
  nodes: Array<TopicTreeNode>;
}

@Component({
  selector: 'app-framework-picker',
  templateUrl: './framework-picker.component.html',
  styleUrls: ['./framework-picker.component.scss']
})
export class FrameworkPickerComponent implements OnInit, OnDestroy {

  @ViewChild('id') public id: ElementRef;

  @Input() formTopics: any;

  @Input() key: any;

  @Input() selectedTopics: any;

  @Input() topicPickerClass: string;

  @Output() topicChanges = new EventEmitter();

  @Input() tenant = 'space';
  public placeHolder: string;

  public selectedNodes: any;
  nodeName: string;
  name: string;
  count = 0;

  constructor() {
  }
  ngOnInit() {
// console.log('framework picker = ', this.id.nativeElement.classList[0], this.id.nativeElement, this.id, this.key);
if (this.key === 'topic') {
  this.nodeName = 'topic';
  this.name = 'Framework';
} else {
  this.nodeName = 'framework';
  this.name = 'Sector';
}
    const selectedTopics = _.reduce(this.selectedTopics, (collector, element) => {
      if (typeof element === 'string') {
        collector.unformatted.push(element);
      } else if (_.get(element, 'identifier')) {
        collector.formated.push(element);
      }
      return collector;
    }, { formated: [], unformatted: [] });
    this.formatSelectedTopics(this.formTopics.range, selectedTopics.unformatted, selectedTopics.formated);
    this.selectedTopics = selectedTopics.formated;
    this.selectedNodes = { ...selectedTopics.formated };
    this.topicChanges.emit(this.selectedTopics);
    if (this.selectedTopics.length === 0) {
      this.placeHolder = 'Select';
    } else if (this.selectedTopics.length > 0) {
      this.placeHolder = this.selectedTopics.length + ' selected';
           }
           this.initTopicPicker(this.formatTopics(this.formTopics.range));
  }
  private formatSelectedTopics(topics, unformatted, formated) {
    _.forEach(topics, (topic) => {
      if (unformatted.includes(topic.name)) {
        formated.push({
          identifier: topic.identifier,
          name: topic.name
        });
      }
      if (topic.children) {
        this.formatSelectedTopics(topic.children, unformatted, formated);
      }
    });
  }
  // ngAfterViewInit() {
  //   this.initTopicPicker(this.formatTopics(this.formTopics.range));
  // }
  private initTopicPicker(data: Array<TopicTreeNode>) {
$('.framework').treePicker({
      data: data,
      name: this.name,
      count: this.count,
      tenant: this.tenant,
      noDataMessage: 'No Topics/SubTopics found',
      picked: _.map(this.selectedNodes, 'identifier'),
      onSubmit: (selectedNodes) => {
        this.selectedTopics = _.map(selectedNodes, node => ({
          identifier: node.id,
          name: node.name
        }));
        this.placeHolder = this.selectedTopics.length + ' selected';
        this.topicChanges.emit(this.selectedTopics);
      },
      nodeName: this.nodeName,
      minSearchQueryLength: 1
    });
    setTimeout(() =>
      document.getElementById(this.nodeName).classList.add(this.topicPickerClass), 200);
   }
  private formatTopics(topics, subTopic = false): Array<TopicTreeNode> {
    return _.map(topics, (topic) => ({
      id: topic.identifier,
      name: topic.name,
      selectable: subTopic ? 'selectable' : 'selectable',
      nodes: this.formatTopics(topic.children, true)
    }));
  }
  ngOnDestroy() {
  }
}
